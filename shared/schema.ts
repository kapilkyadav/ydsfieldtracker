import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, boolean, timestamp, numeric, integer, bigserial, jsonb, date, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums as TypeScript types
export type UserRole = "ADMIN" | "MANAGER" | "SALES" | "PROJECTS";
export type SessionStatus = "OPEN" | "CLOSED";
export type VisitType = "SALES_MEETING" | "SITE_VISIT";
export type VisitStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
export type VisitEventType = "CHECK_IN" | "CHECK_OUT" | "PHOTO" | "NOTE" | "STATUS_CHANGE";
export type ExpenseClaimStatus = "DRAFT" | "SUBMITTED" | "NEEDS_APPROVAL" | "APPROVED" | "REJECTED";
export type ExpenseApprovalAction = "APPROVE" | "REJECT" | "REQUEST_INFO" | "ADJUST";
export type LocationSource = "START_DAY" | "END_DAY" | "PING" | "CHECK_IN" | "CHECK_OUT";

// Users table
export const users = pgTable("users", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").$type<UserRole>().notNull().default("SALES"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Devices table
export const devices = pgTable("devices", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  deviceFingerprint: text("device_fingerprint").notNull().unique(),
  platform: text("platform"),
  lastSeenAt: timestamp("last_seen_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Clients table
export const clients = pgTable("clients", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone"),
  email: text("email"),
  city: text("city"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Projects table
export const projects = pgTable("projects", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  projectCode: text("project_code").notNull().unique(),
  clientId: varchar("client_id", { length: 36 }).references(() => clients.id),
  siteAddressText: text("site_address_text"),
  siteLat: numeric("site_lat", { precision: 10, scale: 7 }),
  siteLng: numeric("site_lng", { precision: 10, scale: 7 }),
  status: text("status").default("ACTIVE"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Duty Sessions table
export const dutySessions = pgTable("duty_sessions", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  deviceId: varchar("device_id", { length: 36 }).references(() => devices.id),
  startAt: timestamp("start_at").defaultNow().notNull(),
  endAt: timestamp("end_at"),
  startLat: numeric("start_lat", { precision: 10, scale: 7 }),
  startLng: numeric("start_lng", { precision: 10, scale: 7 }),
  endLat: numeric("end_lat", { precision: 10, scale: 7 }),
  endLng: numeric("end_lng", { precision: 10, scale: 7 }),
  startAddressText: text("start_address_text"),
  endAddressText: text("end_address_text"),
  status: text("status").$type<SessionStatus>().notNull().default("OPEN"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userStartAtIdx: index("duty_sessions_user_start_at_idx").on(table.userId, table.startAt),
}));

// Location Points table
export const locationPoints = pgTable("location_points", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  sessionId: varchar("session_id", { length: 36 }).notNull().references(() => dutySessions.id),
  capturedAt: timestamp("captured_at").defaultNow().notNull(),
  lat: numeric("lat", { precision: 10, scale: 7 }).notNull(),
  lng: numeric("lng", { precision: 10, scale: 7 }).notNull(),
  accuracyM: numeric("accuracy_m", { precision: 8, scale: 2 }),
  speedMps: numeric("speed_mps", { precision: 8, scale: 2 }),
  batteryPct: integer("battery_pct"),
  source: text("source").$type<LocationSource>().notNull(),
  isMock: boolean("is_mock").default(false),
}, (table) => ({
  sessionCapturedAtIdx: index("location_points_session_captured_at_idx").on(table.sessionId, table.capturedAt),
}));

// Visits table
export const visits = pgTable("visits", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  visitType: text("visit_type").$type<VisitType>().notNull(),
  createdByUserId: varchar("created_by_user_id", { length: 36 }).notNull().references(() => users.id),
  assignedToUserId: varchar("assigned_to_user_id", { length: 36 }).notNull().references(() => users.id),
  assignedByUserId: varchar("assigned_by_user_id", { length: 36 }).references(() => users.id),
  clientId: varchar("client_id", { length: 36 }).references(() => clients.id),
  projectId: varchar("project_id", { length: 36 }).references(() => projects.id),
  title: text("title").notNull(),
  purpose: text("purpose"),
  plannedStartAt: timestamp("planned_start_at"),
  plannedEndAt: timestamp("planned_end_at"),
  locationAddressText: text("location_address_text").notNull(),
  locationLat: numeric("location_lat", { precision: 10, scale: 7 }).notNull(),
  locationLng: numeric("location_lng", { precision: 10, scale: 7 }).notNull(),
  geofenceRadiusM: integer("geofence_radius_m").default(150),
  status: text("status").$type<VisitStatus>().notNull().default("PLANNED"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  assignedToPlannedStartIdx: index("visits_assigned_to_planned_start_idx").on(table.assignedToUserId, table.plannedStartAt),
}));

// Visit Events table
export const visitEvents = pgTable("visit_events", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  visitId: varchar("visit_id", { length: 36 }).notNull().references(() => visits.id),
  eventType: text("event_type").$type<VisitEventType>().notNull(),
  eventAt: timestamp("event_at").defaultNow().notNull(),
  lat: numeric("lat", { precision: 10, scale: 7 }),
  lng: numeric("lng", { precision: 10, scale: 7 }),
  accuracyM: numeric("accuracy_m", { precision: 8, scale: 2 }),
  distanceToTargetM: numeric("distance_to_target_m", { precision: 10, scale: 2 }),
  photoUrl: text("photo_url"),
  note: text("note"),
  createdByUserId: varchar("created_by_user_id", { length: 36 }).notNull().references(() => users.id),
}, (table) => ({
  visitEventAtIdx: index("visit_events_visit_event_at_idx").on(table.visitId, table.eventAt),
}));

// Expense Policies table
export const expensePolicies = pgTable("expense_policies", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  ratePerKm: numeric("rate_per_km", { precision: 8, scale: 2 }).notNull(),
  minAccuracyM: integer("min_accuracy_m").default(50),
  pingIntervalSec: integer("ping_interval_sec").default(60),
  geofenceDefaultM: integer("geofence_default_m").default(150),
  calcMode: text("calc_mode").default("TRACK_SUM"),
  effectiveFrom: date("effective_from").notNull(),
  isActive: boolean("is_active").default(true),
});

// Expense Claims table
export const expenseClaims = pgTable("expense_claims", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  sessionId: varchar("session_id", { length: 36 }).notNull().references(() => dutySessions.id),
  policyId: varchar("policy_id", { length: 36 }).references(() => expensePolicies.id),
  firstBusinessVisitId: varchar("first_business_visit_id", { length: 36 }).references(() => visits.id),
  lastBusinessVisitId: varchar("last_business_visit_id", { length: 36 }).references(() => visits.id),
  businessStartAt: timestamp("business_start_at"),
  businessEndAt: timestamp("business_end_at"),
  kmClaimed: numeric("km_claimed", { precision: 10, scale: 2 }).default("0"),
  kmApproved: numeric("km_approved", { precision: 10, scale: 2 }).default("0"),
  amountClaimed: numeric("amount_claimed", { precision: 10, scale: 2 }).default("0"),
  amountApproved: numeric("amount_approved", { precision: 10, scale: 2 }).default("0"),
  status: text("status").$type<ExpenseClaimStatus>().notNull().default("DRAFT"),
  exceptionReason: text("exception_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  sessionIdIdx: index("expense_claims_session_id_idx").on(table.sessionId),
  statusIdx: index("expense_claims_status_idx").on(table.status),
}));

// Expense Approvals table
export const expenseApprovals = pgTable("expense_approvals", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  claimId: varchar("claim_id", { length: 36 }).notNull().references(() => expenseClaims.id),
  action: text("action").$type<ExpenseApprovalAction>().notNull(),
  approvedByUserId: varchar("approved_by_user_id", { length: 36 }).notNull().references(() => users.id),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Audit Logs table
export const auditLogs = pgTable("audit_logs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  actorUserId: varchar("actor_user_id", { length: 36 }).references(() => users.id),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  action: text("action").notNull(),
  beforeJson: jsonb("before_json"),
  afterJson: jsonb("after_json"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  dutySessions: many(dutySessions),
  devices: many(devices),
  createdVisits: many(visits, { relationName: "createdByUser" }),
  assignedVisits: many(visits, { relationName: "assignedToUser" }),
  expenseClaims: many(expenseClaims),
}));

export const devicesRelations = relations(devices, ({ one }) => ({
  user: one(users, { fields: [devices.userId], references: [users.id] }),
}));

export const clientsRelations = relations(clients, ({ many }) => ({
  projects: many(projects),
  visits: many(visits),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(clients, { fields: [projects.clientId], references: [clients.id] }),
  visits: many(visits),
}));

export const dutySessionsRelations = relations(dutySessions, ({ one, many }) => ({
  user: one(users, { fields: [dutySessions.userId], references: [users.id] }),
  device: one(devices, { fields: [dutySessions.deviceId], references: [devices.id] }),
  locationPoints: many(locationPoints),
  expenseClaims: many(expenseClaims),
}));

export const locationPointsRelations = relations(locationPoints, ({ one }) => ({
  session: one(dutySessions, { fields: [locationPoints.sessionId], references: [dutySessions.id] }),
}));

export const visitsRelations = relations(visits, ({ one, many }) => ({
  createdByUser: one(users, { fields: [visits.createdByUserId], references: [users.id], relationName: "createdByUser" }),
  assignedToUser: one(users, { fields: [visits.assignedToUserId], references: [users.id], relationName: "assignedToUser" }),
  assignedByUser: one(users, { fields: [visits.assignedByUserId], references: [users.id] }),
  client: one(clients, { fields: [visits.clientId], references: [clients.id] }),
  project: one(projects, { fields: [visits.projectId], references: [projects.id] }),
  events: many(visitEvents),
}));

export const visitEventsRelations = relations(visitEvents, ({ one }) => ({
  visit: one(visits, { fields: [visitEvents.visitId], references: [visits.id] }),
  createdByUser: one(users, { fields: [visitEvents.createdByUserId], references: [users.id] }),
}));

export const expensePoliciesRelations = relations(expensePolicies, ({ many }) => ({
  claims: many(expenseClaims),
}));

export const expenseClaimsRelations = relations(expenseClaims, ({ one, many }) => ({
  user: one(users, { fields: [expenseClaims.userId], references: [users.id] }),
  session: one(dutySessions, { fields: [expenseClaims.sessionId], references: [dutySessions.id] }),
  policy: one(expensePolicies, { fields: [expenseClaims.policyId], references: [expensePolicies.id] }),
  firstBusinessVisit: one(visits, { fields: [expenseClaims.firstBusinessVisitId], references: [visits.id] }),
  lastBusinessVisit: one(visits, { fields: [expenseClaims.lastBusinessVisitId], references: [visits.id] }),
  approvals: many(expenseApprovals),
}));

export const expenseApprovalsRelations = relations(expenseApprovals, ({ one }) => ({
  claim: one(expenseClaims, { fields: [expenseApprovals.claimId], references: [expenseClaims.id] }),
  approvedByUser: one(users, { fields: [expenseApprovals.approvedByUserId], references: [users.id] }),
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertDeviceSchema = createInsertSchema(devices).omit({ id: true, createdAt: true });
export const insertClientSchema = createInsertSchema(clients).omit({ id: true, createdAt: true });
export const insertProjectSchema = createInsertSchema(projects).omit({ id: true, createdAt: true });
export const insertDutySessionSchema = createInsertSchema(dutySessions).omit({ id: true, createdAt: true });
export const insertLocationPointSchema = createInsertSchema(locationPoints).omit({ id: true });
export const insertVisitSchema = createInsertSchema(visits).omit({ id: true, createdAt: true });
export const insertVisitEventSchema = createInsertSchema(visitEvents).omit({ id: true });
export const insertExpensePolicySchema = createInsertSchema(expensePolicies).omit({ id: true });
export const insertExpenseClaimSchema = createInsertSchema(expenseClaims).omit({ id: true, createdAt: true });
export const insertExpenseApprovalSchema = createInsertSchema(expenseApprovals).omit({ id: true, createdAt: true });
export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({ id: true, createdAt: true });

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Device = typeof devices.$inferSelect;
export type InsertDevice = z.infer<typeof insertDeviceSchema>;
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type DutySession = typeof dutySessions.$inferSelect;
export type InsertDutySession = z.infer<typeof insertDutySessionSchema>;
export type LocationPoint = typeof locationPoints.$inferSelect;
export type InsertLocationPoint = z.infer<typeof insertLocationPointSchema>;
export type Visit = typeof visits.$inferSelect;
export type InsertVisit = z.infer<typeof insertVisitSchema>;
export type VisitEvent = typeof visitEvents.$inferSelect;
export type InsertVisitEvent = z.infer<typeof insertVisitEventSchema>;
export type ExpensePolicy = typeof expensePolicies.$inferSelect;
export type InsertExpensePolicy = z.infer<typeof insertExpensePolicySchema>;
export type ExpenseClaim = typeof expenseClaims.$inferSelect;
export type InsertExpenseClaim = z.infer<typeof insertExpenseClaimSchema>;
export type ExpenseApproval = typeof expenseApprovals.$inferSelect;
export type InsertExpenseApproval = z.infer<typeof insertExpenseApprovalSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
