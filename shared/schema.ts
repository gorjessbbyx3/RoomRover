import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // admin, manager, helper
  property: text("property"), // P1, P2, or null for admin/helper
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const properties = pgTable("properties", {
  id: text("id").primaryKey(), // P1, P2
  name: text("name").notNull(),
  description: text("description"),
  frontDoorCode: text("front_door_code"),
  codeExpiry: timestamp("code_expiry"),
  rateDaily: decimal("rate_daily", { precision: 10, scale: 2 }).notNull(),
  rateWeekly: decimal("rate_weekly", { precision: 10, scale: 2 }).notNull(),
  rateMonthly: decimal("rate_monthly", { precision: 10, scale: 2 }).notNull(),
});

export const rooms = pgTable("rooms", {
  id: text("id").primaryKey(), // P1-R1, P1-R2, etc.
  propertyId: text("property_id").notNull().references(() => properties.id),
  roomNumber: integer("room_number").notNull(),
  status: text("status").notNull().default("available"), // available, occupied, cleaning, maintenance
  doorCode: text("door_code"),
  codeExpiry: timestamp("code_expiry"),
  cleaningStatus: text("cleaning_status").notNull().default("clean"), // clean, dirty, in_progress
  linenStatus: text("linen_status").notNull().default("fresh"), // fresh, used, needs_replacement
  lastCleaned: timestamp("last_cleaned"),
  lastLinenChange: timestamp("last_linen_change"),
  notes: text("notes"),
});

export const guests = pgTable("guests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  contact: text("contact").notNull(),
  contactType: text("contact_type").notNull(), // phone, email
  referralSource: text("referral_source"),
  cashAppTag: text("cash_app_tag"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const bookings = pgTable("bookings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: text("room_id").notNull().references(() => rooms.id),
  guestId: varchar("guest_id").notNull().references(() => guests.id),
  plan: text("plan").notNull(), // daily, weekly, monthly
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, paid, overdue
  status: text("status").notNull().default("active"), // active, completed, cancelled
  doorCode: text("door_code"),
  frontDoorCode: text("front_door_code"),
  codeExpiry: timestamp("code_expiry"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull().references(() => bookings.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  method: text("method").notNull(), // cash, cash_app
  transactionId: text("transaction_id"), // for Cash App
  dateReceived: timestamp("date_received").notNull(),
  receivedBy: varchar("received_by").notNull().references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cleaningTasks = pgTable("cleaning_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: text("room_id").references(() => rooms.id),
  propertyId: text("property_id").references(() => properties.id),
  type: text("type").notNull(), // room_cleaning, linen_change, common_area, trash_pickup
  title: text("title").notNull(),
  description: text("description"),
  priority: text("priority").notNull().default("normal"), // low, normal, high, critical
  status: text("status").notNull().default("pending"), // pending, in_progress, completed
  assignedTo: varchar("assigned_to").references(() => users.id),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  completedBy: varchar("completed_by").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const inventory = pgTable("inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: text("property_id").notNull().references(() => properties.id),
  item: text("item").notNull(),
  quantity: integer("quantity").notNull().default(0),
  threshold: integer("threshold").notNull().default(5),
  unit: text("unit").notNull().default("pieces"),
  notes: text("notes"),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const maintenance = pgTable("maintenance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roomId: text("room_id").references(() => rooms.id),
  propertyId: text("property_id").references(() => properties.id),
  issue: text("issue").notNull(),
  description: text("description"),
  priority: text("priority").notNull().default("normal"), // low, normal, high, critical
  status: text("status").notNull().default("open"), // open, in_progress, completed
  reportedBy: varchar("reported_by").notNull().references(() => users.id),
  assignedTo: varchar("assigned_to").references(() => users.id),
  dateReported: timestamp("date_reported").defaultNow(),
  dateCompleted: timestamp("date_completed"),
  notes: text("notes"),
});

export const inquiries = pgTable("inquiries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  contact: text("contact").notNull(),
  email: text("email").notNull(),
  referralSource: text("referral_source"),
  preferredPlan: text("preferred_plan").notNull(), // daily, weekly, monthly
  message: text("message"),
  status: text("status").notNull().default("received"), // received, payment_confirmed, booking_confirmed, cancelled
  trackerToken: text("tracker_token").notNull().unique(),
  tokenExpiry: timestamp("token_expiry").notNull(),
  bookingId: varchar("booking_id").references(() => bookings.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const auditLog = pgTable("audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  details: text("details"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const bannedUsers = pgTable("banned_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name"),
  phone: text("phone"),
  email: text("email").notNull(),
  reason: text("reason").notNull(),
  bannedDate: timestamp("banned_date").defaultNow(),
  bannedBy: varchar("banned_by").notNull().references(() => users.id),
});

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertPropertySchema = createInsertSchema(properties);

export const insertRoomSchema = createInsertSchema(rooms);

export const insertGuestSchema = createInsertSchema(guests).omit({
  id: true,
  createdAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  createdAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
});

export const insertCleaningTaskSchema = createInsertSchema(cleaningTasks).omit({
  id: true,
  createdAt: true,
});

export const insertInventorySchema = createInsertSchema(inventory).omit({
  id: true,
  lastUpdated: true,
});

export const insertMaintenanceSchema = createInsertSchema(maintenance).omit({
  id: true,
  dateReported: true,
});

export const insertInquirySchema = createInsertSchema(inquiries).omit({
  id: true,
  createdAt: true,
  trackerToken: true,
  tokenExpiry: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLog).omit({
  id: true,
  timestamp: true,
});

export const insertBannedUserSchema = createInsertSchema(bannedUsers).omit({
  id: true,
  bannedDate: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Property = typeof properties.$inferSelect;
export type InsertProperty = z.infer<typeof insertPropertySchema>;

export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;

export type Guest = typeof guests.$inferSelect;
export type InsertGuest = z.infer<typeof insertGuestSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;

export type CleaningTask = typeof cleaningTasks.$inferSelect;
export type InsertCleaningTask = z.infer<typeof insertCleaningTaskSchema>;

export type Inventory = typeof inventory.$inferSelect;
export type InsertInventory = z.infer<typeof insertInventorySchema>;

export type Maintenance = typeof maintenance.$inferSelect;
export type InsertMaintenance = z.infer<typeof insertMaintenanceSchema>;

export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = z.infer<typeof insertInquirySchema>;

export type AuditLog = typeof auditLog.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

export type BannedUser = typeof bannedUsers.$inferSelect;
export type InsertBannedUser = z.infer<typeof insertBannedUserSchema>;
