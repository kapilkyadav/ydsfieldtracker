import type { Express } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authMiddleware, requireManager, hashPassword, verifyPassword, generateToken, type AuthenticatedRequest } from "./auth";
import { haversineDistance, isWithinGeofence, calculateDistance, calculateExpenseFromPoints } from "./utils";
import { loginSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Serve uploaded files
  app.use("/uploads", (req, res, next) => {
    res.setHeader("Cache-Control", "public, max-age=31536000");
    next();
  }, express.static(uploadsDir));

  // Auth Routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const result = loginSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid email or password format" });
      }

      const { email, password } = result.data;
      const user = await storage.getUserByEmail(email);

      if (!user || !user.isActive) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const isValid = await verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      const token = generateToken(user);
      const { passwordHash, ...userWithoutPassword } = user;

      res.json({ ...userWithoutPassword, token });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", authMiddleware, (req, res) => {
    res.json({ message: "Logged out successfully" });
  });

  app.get("/api/me", authMiddleware, (req: AuthenticatedRequest, res) => {
    res.json(req.user);
  });

  // Users Routes (Admin/Manager)
  app.get("/api/users", authMiddleware, requireManager, async (req, res) => {
    try {
      const users = await storage.getUsers();
      const usersWithoutPasswords = users.map(({ passwordHash, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Get users error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/users", authMiddleware, requireManager, async (req, res) => {
    try {
      const { email, password, fullName, role } = req.body;
      
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const passwordHash = await hashPassword(password);
      const user = await storage.createUser({
        email,
        passwordHash,
        fullName,
        role: role || "SALES",
        isActive: true,
      });

      const { passwordHash: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.patch("/api/users/:id", authMiddleware, requireManager, async (req, res) => {
    try {
      const { id } = req.params;
      const { isActive, role } = req.body;

      const user = await storage.updateUser(id, { isActive, role });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const { passwordHash, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Update user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Duty Sessions Routes
  app.post("/api/sessions/start", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { lat, lng, accuracyM, addressText } = req.body;

      // Check for existing open session
      const existingSession = await storage.getOpenSessionForUser(userId);
      if (existingSession) {
        return res.status(400).json({ message: "You already have an open duty session" });
      }

      const session = await storage.createDutySession({
        userId,
        startAt: new Date(),
        startLat: lat,
        startLng: lng,
        startAddressText: addressText || null,
        status: "OPEN",
      });

      // Create initial location point
      await storage.createLocationPoint({
        sessionId: session.id,
        capturedAt: new Date(),
        lat,
        lng,
        accuracyM,
        source: "START_DAY",
      });

      res.status(201).json(session);
    } catch (error) {
      console.error("Start session error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/sessions/:id/ping", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { lat, lng, accuracyM, speedMps, batteryPct } = req.body;

      const session = await storage.getDutySession(id);
      if (!session || session.userId !== req.user!.id || session.status !== "OPEN") {
        return res.status(404).json({ message: "Session not found or closed" });
      }

      const point = await storage.createLocationPoint({
        sessionId: id,
        capturedAt: new Date(),
        lat,
        lng,
        accuracyM,
        speedMps: speedMps || null,
        batteryPct: batteryPct || null,
        source: "PING",
      });

      res.json(point);
    } catch (error) {
      console.error("Ping error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/sessions/:id/end", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const { lat, lng, accuracyM, addressText } = req.body;

      const session = await storage.getDutySession(id);
      if (!session || session.userId !== req.user!.id) {
        return res.status(404).json({ message: "Session not found" });
      }

      if (session.status !== "OPEN") {
        return res.status(400).json({ message: "Session is already closed" });
      }

      // Create end location point
      await storage.createLocationPoint({
        sessionId: id,
        capturedAt: new Date(),
        lat,
        lng,
        accuracyM,
        source: "END_DAY",
      });

      // Update session
      const updatedSession = await storage.updateDutySession(id, {
        status: "CLOSED",
        endAt: new Date(),
        endLat: lat,
        endLng: lng,
        endAddressText: addressText || null,
      });

      // Generate expense claim
      await generateExpenseClaim(req.user!.id, id);

      res.json(updatedSession);
    } catch (error) {
      console.error("End session error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/sessions/today", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const session = await storage.getTodaySessionForUser(userId);
      
      let visitsToday: any[] = [];
      let expenseClaim = null;

      if (session) {
        visitsToday = await storage.getVisitsForUser(userId);
        
        // Enrich visits with client/project names
        const clients = await storage.getClients();
        const projects = await storage.getProjects();
        const clientMap = new Map(clients.map(c => [c.id, c.name]));
        const projectMap = new Map(projects.map(p => [p.id, p.projectCode]));

        visitsToday = visitsToday.map(v => ({
          ...v,
          clientName: v.clientId ? clientMap.get(v.clientId) : undefined,
          projectCode: v.projectId ? projectMap.get(v.projectId) : undefined,
        }));

        expenseClaim = await storage.getExpenseClaimForSession(session.id);
      }

      res.json({ session, visitsToday, expenseClaim });
    } catch (error) {
      console.error("Get today session error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Visits Routes
  app.get("/api/visits", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { date, type } = req.query;

      let visits;
      if (type === "upcoming") {
        visits = await storage.getUpcomingVisitsForUser(userId);
      } else {
        const targetDate = date ? new Date(date as string) : new Date();
        visits = await storage.getVisitsForUser(userId, targetDate);
      }

      // Enrich with client/project names
      const clients = await storage.getClients();
      const projects = await storage.getProjects();
      const clientMap = new Map(clients.map(c => [c.id, c.name]));
      const projectMap = new Map(projects.map(p => [p.id, p.projectCode]));

      const enrichedVisits = visits.map(v => ({
        ...v,
        clientName: v.clientId ? clientMap.get(v.clientId) : undefined,
        projectCode: v.projectId ? projectMap.get(v.projectId) : undefined,
      }));

      res.json(enrichedVisits);
    } catch (error) {
      console.error("Get visits error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/visits", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { visitType, title, purpose, clientId, projectId, locationAddressText, locationLat, locationLng, plannedStartAt, geofenceRadiusM } = req.body;

      const visit = await storage.createVisit({
        visitType,
        title,
        purpose: purpose || null,
        clientId: clientId || null,
        projectId: projectId || null,
        locationAddressText,
        locationLat,
        locationLng,
        plannedStartAt: plannedStartAt ? new Date(plannedStartAt) : null,
        geofenceRadiusM: geofenceRadiusM || 150,
        createdByUserId: userId,
        assignedToUserId: userId,
        status: "PLANNED",
      });

      res.status(201).json(visit);
    } catch (error) {
      console.error("Create visit error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/visits/assign", authMiddleware, requireManager, async (req: AuthenticatedRequest, res) => {
    try {
      const managerId = req.user!.id;
      const { assignedToUserId, visitType, title, purpose, clientId, projectId, locationAddressText, locationLat, locationLng, plannedStartAt, geofenceRadiusM } = req.body;

      const visit = await storage.createVisit({
        visitType,
        title,
        purpose: purpose || null,
        clientId: clientId || null,
        projectId: projectId || null,
        locationAddressText,
        locationLat,
        locationLng,
        plannedStartAt: plannedStartAt ? new Date(plannedStartAt) : null,
        geofenceRadiusM: geofenceRadiusM || 150,
        createdByUserId: managerId,
        assignedToUserId,
        assignedByUserId: managerId,
        status: "PLANNED",
      });

      res.status(201).json(visit);
    } catch (error) {
      console.error("Assign visit error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/visits/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const visit = await storage.getVisit(id);

      if (!visit) {
        return res.status(404).json({ message: "Visit not found" });
      }

      // Check access
      if (visit.assignedToUserId !== req.user!.id && 
          !["ADMIN", "MANAGER"].includes(req.user!.role)) {
        return res.status(403).json({ message: "Access denied" });
      }

      const events = await storage.getVisitEvents(id);

      // Enrich with client/project names
      let clientName, projectCode;
      if (visit.clientId) {
        const client = await storage.getClient(visit.clientId);
        clientName = client?.name;
      }
      if (visit.projectId) {
        const project = await storage.getProject(visit.projectId);
        projectCode = project?.projectCode;
      }

      res.json({
        visit: { ...visit, clientName, projectCode },
        events,
      });
    } catch (error) {
      console.error("Get visit error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/visits/:id/checkin", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { lat, lng, accuracyM } = req.body;

      const visit = await storage.getVisit(id);
      if (!visit || visit.assignedToUserId !== userId) {
        return res.status(404).json({ message: "Visit not found" });
      }

      if (visit.status !== "PLANNED") {
        return res.status(400).json({ message: "Visit is not in PLANNED status" });
      }

      // Check accuracy
      const accuracy = parseFloat(accuracyM);
      if (accuracy > 80) {
        return res.status(400).json({ message: "GPS accuracy is too low. Please move to an open area and retry." });
      }

      // Check geofence
      const targetLat = parseFloat(visit.locationLat?.toString() || "0");
      const targetLng = parseFloat(visit.locationLng?.toString() || "0");
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const radiusM = visit.geofenceRadiusM || 150;

      if (!isWithinGeofence(userLat, userLng, targetLat, targetLng, radiusM)) {
        const distance = calculateDistance(userLat, userLng, targetLat, targetLng);
        return res.status(400).json({ 
          message: `You are ${Math.round(distance)}m away from the target location. Must be within ${radiusM}m to check in.` 
        });
      }

      // Create check-in event
      const distanceToTarget = calculateDistance(userLat, userLng, targetLat, targetLng);
      await storage.createVisitEvent({
        visitId: id,
        eventType: "CHECK_IN",
        eventAt: new Date(),
        lat,
        lng,
        accuracyM,
        distanceToTargetM: distanceToTarget.toString(),
        createdByUserId: userId,
      });

      // Update visit status
      const updatedVisit = await storage.updateVisit(id, { status: "IN_PROGRESS" });

      // Also ping the session
      const session = await storage.getOpenSessionForUser(userId);
      if (session) {
        await storage.createLocationPoint({
          sessionId: session.id,
          capturedAt: new Date(),
          lat,
          lng,
          accuracyM,
          source: "CHECK_IN",
        });
      }

      res.json(updatedVisit);
    } catch (error) {
      console.error("Check-in error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/visits/:id/checkout", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { lat, lng, accuracyM, note } = req.body;

      const visit = await storage.getVisit(id);
      if (!visit || visit.assignedToUserId !== userId) {
        return res.status(404).json({ message: "Visit not found" });
      }

      if (visit.status !== "IN_PROGRESS") {
        return res.status(400).json({ message: "Visit is not in IN_PROGRESS status" });
      }

      // Check for required proof
      const events = await storage.getVisitEvents(id);
      const hasPhoto = events.some(e => e.eventType === "PHOTO" && e.photoUrl);
      const hasNote = events.some(e => e.eventType === "NOTE" && e.note) || !!note;

      if (!hasPhoto || !hasNote) {
        return res.status(400).json({ 
          message: "Must have at least 1 photo and 1 note before checking out" 
        });
      }

      // Create checkout event
      const targetLat = parseFloat(visit.locationLat?.toString() || "0");
      const targetLng = parseFloat(visit.locationLng?.toString() || "0");
      const userLat = parseFloat(lat);
      const userLng = parseFloat(lng);
      const distanceToTarget = calculateDistance(userLat, userLng, targetLat, targetLng);

      await storage.createVisitEvent({
        visitId: id,
        eventType: "CHECK_OUT",
        eventAt: new Date(),
        lat,
        lng,
        accuracyM,
        distanceToTargetM: distanceToTarget.toString(),
        note: note || null,
        createdByUserId: userId,
      });

      // Update visit status
      const updatedVisit = await storage.updateVisit(id, { status: "COMPLETED" });

      // Also ping the session
      const session = await storage.getOpenSessionForUser(userId);
      if (session) {
        await storage.createLocationPoint({
          sessionId: session.id,
          capturedAt: new Date(),
          lat,
          lng,
          accuracyM,
          source: "CHECK_OUT",
        });
      }

      res.json(updatedVisit);
    } catch (error) {
      console.error("Check-out error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/visits/:id/photo", authMiddleware, upload.single("photo"), async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const visit = await storage.getVisit(id);
      if (!visit || visit.assignedToUserId !== userId) {
        return res.status(404).json({ message: "Visit not found" });
      }

      if (visit.status !== "IN_PROGRESS") {
        return res.status(400).json({ message: "Can only add photos during an active visit" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "No photo uploaded" });
      }

      const photoUrl = `/uploads/${req.file.filename}`;

      const event = await storage.createVisitEvent({
        visitId: id,
        eventType: "PHOTO",
        eventAt: new Date(),
        photoUrl,
        createdByUserId: userId,
      });

      res.status(201).json(event);
    } catch (error) {
      console.error("Add photo error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/visits/:id/note", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const { note } = req.body;

      const visit = await storage.getVisit(id);
      if (!visit || visit.assignedToUserId !== userId) {
        return res.status(404).json({ message: "Visit not found" });
      }

      if (visit.status !== "IN_PROGRESS") {
        return res.status(400).json({ message: "Can only add notes during an active visit" });
      }

      if (!note || !note.trim()) {
        return res.status(400).json({ message: "Note text is required" });
      }

      const event = await storage.createVisitEvent({
        visitId: id,
        eventType: "NOTE",
        eventAt: new Date(),
        note: note.trim(),
        createdByUserId: userId,
      });

      res.status(201).json(event);
    } catch (error) {
      console.error("Add note error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Clients and Projects
  app.get("/api/clients", authMiddleware, async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      console.error("Get clients error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/projects", authMiddleware, async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      console.error("Get projects error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Expenses Routes
  app.get("/api/expenses/mine", authMiddleware, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.id;
      const { type } = req.query;

      if (type === "today") {
        const session = await storage.getTodaySessionForUser(userId);
        if (!session) {
          return res.json(null);
        }
        const claim = await storage.getExpenseClaimForSession(session.id);
        return res.json(claim);
      }

      const claims = await storage.getExpenseClaimsForUser(userId);
      res.json(claims);
    } catch (error) {
      console.error("Get expenses error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/expenses/pending", authMiddleware, requireManager, async (req, res) => {
    try {
      const claims = await storage.getPendingExpenseClaims();
      res.json(claims);
    } catch (error) {
      console.error("Get pending expenses error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/expenses/:id/approve", authMiddleware, requireManager, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      const managerId = req.user!.id;
      const { action, kmApproved, amountApproved, note } = req.body;

      const claim = await storage.getExpenseClaim(id);
      if (!claim) {
        return res.status(404).json({ message: "Expense claim not found" });
      }

      // Create approval record
      await storage.createExpenseApproval({
        claimId: id,
        action,
        approvedByUserId: managerId,
        note: note || null,
      });

      // Update claim based on action
      let updateData: Partial<typeof claim> = {};
      switch (action) {
        case "APPROVE":
          updateData = {
            status: "APPROVED",
            kmApproved: claim.kmClaimed,
            amountApproved: claim.amountClaimed,
          };
          break;
        case "REJECT":
          updateData = {
            status: "REJECTED",
            kmApproved: "0",
            amountApproved: "0",
          };
          break;
        case "ADJUST":
          updateData = {
            status: "APPROVED",
            kmApproved: kmApproved?.toString() || claim.kmClaimed,
            amountApproved: amountApproved?.toString() || claim.amountClaimed,
          };
          break;
      }

      const updatedClaim = await storage.updateExpenseClaim(id, updateData);

      // Create audit log
      await storage.createAuditLog({
        actorUserId: managerId,
        entityType: "expense_claim",
        entityId: id,
        action: `EXPENSE_${action}`,
        beforeJson: claim,
        afterJson: updatedClaim,
      });

      res.json(updatedClaim);
    } catch (error) {
      console.error("Approve expense error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Manager Dashboard
  app.get("/api/dashboard/manager", authMiddleware, requireManager, async (req, res) => {
    try {
      const usersOnDuty = await storage.getOpenSessionsCount();
      const pendingClaims = await storage.getPendingExpenseClaims();
      const exceptions = await storage.getExceptionCount();

      // Enrich pending claims with user info
      const users = await storage.getUsers();
      const userMap = new Map(users.map(u => [u.id, u]));

      const enrichedClaims = await Promise.all(pendingClaims.map(async claim => {
        const user = userMap.get(claim.userId);
        const session = await storage.getDutySession(claim.sessionId);
        
        // Get visit count for session
        const visits = session ? await storage.getCompletedVisitsForSession(
          claim.userId,
          session.startAt,
          session.endAt || new Date()
        ) : [];

        return {
          id: claim.id,
          userId: claim.userId,
          userName: user?.fullName || "Unknown",
          sessionDate: session?.startAt || claim.createdAt,
          kmClaimed: parseFloat(claim.kmClaimed?.toString() || "0"),
          amountClaimed: parseFloat(claim.amountClaimed?.toString() || "0"),
          status: claim.status,
          exceptionReason: claim.exceptionReason,
          visitCount: visits.length,
        };
      }));

      res.json({
        usersOnDuty,
        pendingApprovals: pendingClaims.length,
        exceptions,
        pendingClaims: enrichedClaims,
      });
    } catch (error) {
      console.error("Manager dashboard error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}

// Helper function to generate expense claim
async function generateExpenseClaim(userId: string, sessionId: string) {
  try {
    const session = await storage.getDutySession(sessionId);
    if (!session) return;

    const policy = await storage.getActivePolicy();
    if (!policy) return;

    // Get completed visits for this session
    const visits = await storage.getCompletedVisitsForSession(
      userId,
      session.startAt,
      session.endAt || new Date()
    );

    // Get check-in/out times from visit events
    let firstCheckIn: Date | null = null;
    let lastCheckOut: Date | null = null;
    let firstVisitId: string | null = null;
    let lastVisitId: string | null = null;

    for (const visit of visits) {
      const events = await storage.getVisitEvents(visit.id);
      const checkIn = events.find(e => e.eventType === "CHECK_IN");
      const checkOut = events.find(e => e.eventType === "CHECK_OUT");

      if (checkIn && (!firstCheckIn || new Date(checkIn.eventAt) < firstCheckIn)) {
        firstCheckIn = new Date(checkIn.eventAt);
        firstVisitId = visit.id;
      }
      if (checkOut && (!lastCheckOut || new Date(checkOut.eventAt) > lastCheckOut)) {
        lastCheckOut = new Date(checkOut.eventAt);
        lastVisitId = visit.id;
      }
    }

    // Get location points within business hours
    let points: any[] = [];
    if (firstCheckIn && lastCheckOut) {
      points = await storage.getLocationPointsInTimeRange(sessionId, firstCheckIn, lastCheckOut);
    }

    // Calculate expense
    const ratePerKm = parseFloat(policy.ratePerKm?.toString() || "10");
    const maxAccuracy = policy.minAccuracyM || 80;

    const locationPoints = points.map(p => ({
      lat: parseFloat(p.lat?.toString() || "0"),
      lng: parseFloat(p.lng?.toString() || "0"),
      accuracy: parseFloat(p.accuracyM?.toString() || "0"),
      capturedAt: new Date(p.capturedAt),
    }));

    const result = calculateExpenseFromPoints(locationPoints, ratePerKm, maxAccuracy);

    // Check if claim already exists
    const existingClaim = await storage.getExpenseClaimForSession(sessionId);

    if (existingClaim) {
      await storage.updateExpenseClaim(existingClaim.id, {
        policyId: policy.id,
        firstBusinessVisitId: firstVisitId,
        lastBusinessVisitId: lastVisitId,
        businessStartAt: result.businessStartAt,
        businessEndAt: result.businessEndAt,
        kmClaimed: result.kmClaimed.toString(),
        amountClaimed: result.amountClaimed.toString(),
        status: result.status,
        exceptionReason: result.exceptionReason,
      });
    } else {
      await storage.createExpenseClaim({
        userId,
        sessionId,
        policyId: policy.id,
        firstBusinessVisitId: firstVisitId,
        lastBusinessVisitId: lastVisitId,
        businessStartAt: result.businessStartAt,
        businessEndAt: result.businessEndAt,
        kmClaimed: result.kmClaimed.toString(),
        amountClaimed: result.amountClaimed.toString(),
        status: result.status,
        exceptionReason: result.exceptionReason,
      });
    }
  } catch (error) {
    console.error("Generate expense claim error:", error);
  }
}
