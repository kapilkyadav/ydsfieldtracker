import { 
  users, dutySessions, locationPoints, visits, visitEvents, 
  expensePolicies, expenseClaims, expenseApprovals, clients, projects, auditLogs,
  type User, type InsertUser, type DutySession, type InsertDutySession,
  type LocationPoint, type InsertLocationPoint, type Visit, type InsertVisit,
  type VisitEvent, type InsertVisitEvent, type ExpensePolicy, type InsertExpensePolicy,
  type ExpenseClaim, type InsertExpenseClaim, type ExpenseApproval, type InsertExpenseApproval,
  type Client, type InsertClient, type Project, type InsertProject,
  type AuditLog, type InsertAuditLog
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc, asc, sql, or } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUsers(): Promise<User[]>;
  updateUser(id: string, data: Partial<User>): Promise<User | undefined>;

  // Duty Sessions
  createDutySession(session: InsertDutySession): Promise<DutySession>;
  getDutySession(id: string): Promise<DutySession | undefined>;
  getOpenSessionForUser(userId: string): Promise<DutySession | undefined>;
  getTodaySessionForUser(userId: string): Promise<DutySession | undefined>;
  updateDutySession(id: string, data: Partial<DutySession>): Promise<DutySession | undefined>;
  getOpenSessionsCount(): Promise<number>;

  // Location Points
  createLocationPoint(point: InsertLocationPoint): Promise<LocationPoint>;
  getLocationPointsForSession(sessionId: string): Promise<LocationPoint[]>;
  getLocationPointsInTimeRange(sessionId: string, startAt: Date, endAt: Date): Promise<LocationPoint[]>;

  // Visits
  createVisit(visit: InsertVisit): Promise<Visit>;
  getVisit(id: string): Promise<Visit | undefined>;
  getVisitsForUser(userId: string, date?: Date): Promise<Visit[]>;
  getUpcomingVisitsForUser(userId: string): Promise<Visit[]>;
  updateVisit(id: string, data: Partial<Visit>): Promise<Visit | undefined>;
  getCompletedVisitsForSession(userId: string, startAt: Date, endAt: Date): Promise<Visit[]>;

  // Visit Events
  createVisitEvent(event: InsertVisitEvent): Promise<VisitEvent>;
  getVisitEvents(visitId: string): Promise<VisitEvent[]>;

  // Clients
  getClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;

  // Projects
  getProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;

  // Expense Policies
  getActivePolicy(): Promise<ExpensePolicy | undefined>;
  createExpensePolicy(policy: InsertExpensePolicy): Promise<ExpensePolicy>;

  // Expense Claims
  createExpenseClaim(claim: InsertExpenseClaim): Promise<ExpenseClaim>;
  getExpenseClaim(id: string): Promise<ExpenseClaim | undefined>;
  getExpenseClaimForSession(sessionId: string): Promise<ExpenseClaim | undefined>;
  updateExpenseClaim(id: string, data: Partial<ExpenseClaim>): Promise<ExpenseClaim | undefined>;
  getExpenseClaimsForUser(userId: string): Promise<ExpenseClaim[]>;
  getPendingExpenseClaims(): Promise<ExpenseClaim[]>;
  getExceptionCount(): Promise<number>;

  // Expense Approvals
  createExpenseApproval(approval: InsertExpenseApproval): Promise<ExpenseApproval>;

  // Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(users.fullName);
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user || undefined;
  }

  // Duty Sessions
  async createDutySession(session: InsertDutySession): Promise<DutySession> {
    const [created] = await db.insert(dutySessions).values(session).returning();
    return created;
  }

  async getDutySession(id: string): Promise<DutySession | undefined> {
    const [session] = await db.select().from(dutySessions).where(eq(dutySessions.id, id));
    return session || undefined;
  }

  async getOpenSessionForUser(userId: string): Promise<DutySession | undefined> {
    const [session] = await db.select().from(dutySessions)
      .where(and(eq(dutySessions.userId, userId), eq(dutySessions.status, "OPEN")));
    return session || undefined;
  }

  async getTodaySessionForUser(userId: string): Promise<DutySession | undefined> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [session] = await db.select().from(dutySessions)
      .where(and(
        eq(dutySessions.userId, userId),
        gte(dutySessions.startAt, today),
        lte(dutySessions.startAt, tomorrow)
      ))
      .orderBy(desc(dutySessions.startAt))
      .limit(1);
    return session || undefined;
  }

  async updateDutySession(id: string, data: Partial<DutySession>): Promise<DutySession | undefined> {
    const [session] = await db.update(dutySessions).set(data).where(eq(dutySessions.id, id)).returning();
    return session || undefined;
  }

  async getOpenSessionsCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(dutySessions)
      .where(eq(dutySessions.status, "OPEN"));
    return Number(result[0]?.count || 0);
  }

  // Location Points
  async createLocationPoint(point: InsertLocationPoint): Promise<LocationPoint> {
    const [created] = await db.insert(locationPoints).values(point).returning();
    return created;
  }

  async getLocationPointsForSession(sessionId: string): Promise<LocationPoint[]> {
    return db.select().from(locationPoints)
      .where(eq(locationPoints.sessionId, sessionId))
      .orderBy(asc(locationPoints.capturedAt));
  }

  async getLocationPointsInTimeRange(sessionId: string, startAt: Date, endAt: Date): Promise<LocationPoint[]> {
    return db.select().from(locationPoints)
      .where(and(
        eq(locationPoints.sessionId, sessionId),
        gte(locationPoints.capturedAt, startAt),
        lte(locationPoints.capturedAt, endAt)
      ))
      .orderBy(asc(locationPoints.capturedAt));
  }

  // Visits
  async createVisit(visit: InsertVisit): Promise<Visit> {
    const [created] = await db.insert(visits).values(visit).returning();
    return created;
  }

  async getVisit(id: string): Promise<Visit | undefined> {
    const [visit] = await db.select().from(visits).where(eq(visits.id, id));
    return visit || undefined;
  }

  async getVisitsForUser(userId: string, date?: Date): Promise<Visit[]> {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    return db.select().from(visits)
      .where(and(
        eq(visits.assignedToUserId, userId),
        or(
          and(gte(visits.plannedStartAt, startOfDay), lte(visits.plannedStartAt, endOfDay)),
          and(gte(visits.createdAt, startOfDay), lte(visits.createdAt, endOfDay))
        )
      ))
      .orderBy(asc(visits.plannedStartAt));
  }

  async getUpcomingVisitsForUser(userId: string): Promise<Visit[]> {
    const now = new Date();
    return db.select().from(visits)
      .where(and(
        eq(visits.assignedToUserId, userId),
        gte(visits.plannedStartAt, now),
        eq(visits.status, "PLANNED")
      ))
      .orderBy(asc(visits.plannedStartAt))
      .limit(20);
  }

  async updateVisit(id: string, data: Partial<Visit>): Promise<Visit | undefined> {
    const [visit] = await db.update(visits).set(data).where(eq(visits.id, id)).returning();
    return visit || undefined;
  }

  async getCompletedVisitsForSession(userId: string, startAt: Date, endAt: Date): Promise<Visit[]> {
    return db.select().from(visits)
      .where(and(
        eq(visits.assignedToUserId, userId),
        eq(visits.status, "COMPLETED")
      ))
      .orderBy(asc(visits.createdAt));
  }

  // Visit Events
  async createVisitEvent(event: InsertVisitEvent): Promise<VisitEvent> {
    const [created] = await db.insert(visitEvents).values(event).returning();
    return created;
  }

  async getVisitEvents(visitId: string): Promise<VisitEvent[]> {
    return db.select().from(visitEvents)
      .where(eq(visitEvents.visitId, visitId))
      .orderBy(asc(visitEvents.eventAt));
  }

  // Clients
  async getClients(): Promise<Client[]> {
    return db.select().from(clients).orderBy(clients.name);
  }

  async getClient(id: string): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async createClient(client: InsertClient): Promise<Client> {
    const [created] = await db.insert(clients).values(client).returning();
    return created;
  }

  // Projects
  async getProjects(): Promise<Project[]> {
    return db.select().from(projects).orderBy(projects.projectCode);
  }

  async getProject(id: string): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async createProject(project: InsertProject): Promise<Project> {
    const [created] = await db.insert(projects).values(project).returning();
    return created;
  }

  // Expense Policies
  async getActivePolicy(): Promise<ExpensePolicy | undefined> {
    const [policy] = await db.select().from(expensePolicies)
      .where(eq(expensePolicies.isActive, true))
      .orderBy(desc(expensePolicies.effectiveFrom))
      .limit(1);
    return policy || undefined;
  }

  async createExpensePolicy(policy: InsertExpensePolicy): Promise<ExpensePolicy> {
    const [created] = await db.insert(expensePolicies).values(policy).returning();
    return created;
  }

  // Expense Claims
  async createExpenseClaim(claim: InsertExpenseClaim): Promise<ExpenseClaim> {
    const [created] = await db.insert(expenseClaims).values(claim).returning();
    return created;
  }

  async getExpenseClaim(id: string): Promise<ExpenseClaim | undefined> {
    const [claim] = await db.select().from(expenseClaims).where(eq(expenseClaims.id, id));
    return claim || undefined;
  }

  async getExpenseClaimForSession(sessionId: string): Promise<ExpenseClaim | undefined> {
    const [claim] = await db.select().from(expenseClaims).where(eq(expenseClaims.sessionId, sessionId));
    return claim || undefined;
  }

  async updateExpenseClaim(id: string, data: Partial<ExpenseClaim>): Promise<ExpenseClaim | undefined> {
    const [claim] = await db.update(expenseClaims).set(data).where(eq(expenseClaims.id, id)).returning();
    return claim || undefined;
  }

  async getExpenseClaimsForUser(userId: string): Promise<ExpenseClaim[]> {
    return db.select().from(expenseClaims)
      .where(eq(expenseClaims.userId, userId))
      .orderBy(desc(expenseClaims.createdAt))
      .limit(30);
  }

  async getPendingExpenseClaims(): Promise<ExpenseClaim[]> {
    return db.select().from(expenseClaims)
      .where(or(
        eq(expenseClaims.status, "SUBMITTED"),
        eq(expenseClaims.status, "NEEDS_APPROVAL")
      ))
      .orderBy(desc(expenseClaims.createdAt));
  }

  async getExceptionCount(): Promise<number> {
    const result = await db.select({ count: sql<number>`count(*)` })
      .from(expenseClaims)
      .where(eq(expenseClaims.status, "NEEDS_APPROVAL"));
    return Number(result[0]?.count || 0);
  }

  // Expense Approvals
  async createExpenseApproval(approval: InsertExpenseApproval): Promise<ExpenseApproval> {
    const [created] = await db.insert(expenseApprovals).values(approval).returning();
    return created;
  }

  // Audit Logs
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [created] = await db.insert(auditLogs).values(log).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
