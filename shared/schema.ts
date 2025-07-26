import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, boolean, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull(), // admin, manager, helper
  property: text("property"), // P1, P2, or null for admin/helper
  name: text("name").notNull(),
  allowedPages: text("allowed_pages"), // JSON array of page paths
  createdAt: timestamp("created_at").defaultNow(),
});

export const userPermissions = pgTable("user_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  pagePath: text("page_path").notNull(), // e.g., '/dashboard', '/payments'
  hasAccess: boolean("has_access").notNull().default(true),
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
  doorCode: text("door_code"), // Guest assigned door code
  codeExpiry: timestamp("code_expiry"),
  masterCode: text("master_code").default("1234"), // Master code for room access
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
  endDate: timestamp("end_date"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, paid, overdue
  status: text("status").notNull().default("active"), // active, completed, cancelled
  doorCode: text("door_code"),
  frontDoorCode: text("front_door_code"),
  codeExpiry: timestamp("code_expiry"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  isTenant: boolean("is_tenant").default(false),
});

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bookingId: varchar("booking_id").notNull().references(() => bookings.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  method: text("method").notNull(), // cash, cash_app
  transactionId: text("transaction_id"), // for Cash App
  dateReceived: timestamp("date_received").notNull(),
  receivedBy: varchar("received_by").notNull().references(() => users.id),
  // Discount and fee fields
  discountAmount: decimal("discount_amount", { precision: 10, scale: 2 }).default("0.00"),
  discountReason: text("discount_reason"),
  hasSecurityDeposit: boolean("has_security_deposit").default(false),
  securityDepositAmount: decimal("security_deposit_amount", { precision: 10, scale: 2 }).default("0.00"),
  securityDepositDiscount: decimal("security_deposit_discount", { precision: 10, scale: 2 }).default("0.00"),
  hasPetFee: boolean("has_pet_fee").default(false),
  petFeeAmount: decimal("pet_fee_amount", { precision: 10, scale: 2 }).default("0.00"),
  petFeeDiscount: decimal("pet_fee_discount", { precision: 10, scale: 2 }).default("0.00"),
  totalPaid: decimal("total_paid", { precision: 10, scale: 2 }).notNull(), // Final amount after discounts
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
  dueDate: timestamp("due_date"),
  // Repeat schedule fields
  isRecurring: boolean("is_recurring").default(false),
  repeatFrequency: text("repeat_frequency"), // daily, weekly, monthly
  repeatInterval: integer("repeat_interval").default(1), // every X days/weeks/months
  repeatEndDate: timestamp("repeat_end_date"),
  parentMaintenanceId: varchar("parent_maintenance_id").references(() => maintenance.id),
  // Inventory linking
  linkedInventoryIds: text("linked_inventory_ids"), // JSON array of inventory item IDs
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

export const insertUserPermissionSchema = createInsertSchema(userPermissions).omit({
  id: true,
  createdAt: true,
});

// Audit log for tracking admin actions
export const auditLogs = pgTable("audit_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  details: text("details"),
  timestamp: timestamp("timestamp").defaultNow(),
});

// Helpers table for assigning staff to properties/rooms
export const helpers = pgTable("helpers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  assignedBy: varchar("assigned_by").references(() => users.id),
  propertyId: text("property_id").references(() => properties.id),
  roomId: text("room_id").references(() => rooms.id),
  role: text("role").notNull().default("cleaning"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Tasks for helpers (extends existing cleaning tasks)
export const tasks = pgTable("tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: text("property_id").references(() => properties.id),
  roomId: text("room_id").references(() => rooms.id),
  helperId: varchar("helper_id").references(() => helpers.id),
  assignedTo: varchar("assigned_to").references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull().default("general"),
  priority: text("priority").notNull().default("normal"),
  status: text("status").notNull().default("pending"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  completedBy: varchar("completed_by").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Messages between users (managers, helpers, guests)
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull().references(() => users.id),
  receiverId: varchar("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  propertyId: text("property_id").references(() => properties.id),
  roomId: text("room_id").references(() => rooms.id),
  bookingId: varchar("booking_id").references(() => bookings.id),
  messageType: text("message_type").notNull().default("general"),
  isRead: boolean("is_read").notNull().default(false),
  sentAt: timestamp("sent_at").defaultNow(),
});

// Reviews for properties, rooms, and service
export const reviews = pgTable("reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reviewerId: varchar("reviewer_id").notNull().references(() => users.id),
  targetId: varchar("target_id").references(() => users.id), // reviewed user (helper, manager)
  propertyId: text("property_id").references(() => properties.id),
  roomId: text("room_id").references(() => rooms.id),
  bookingId: varchar("booking_id").references(() => bookings.id),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  reviewType: text("review_type").notNull().default("property"),
  isVerified: boolean("is_verified").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Property and room photos
export const propertyPhotos = pgTable("property_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: text("property_id").notNull().references(() => properties.id, { onDelete: "cascade" }),
  roomId: text("room_id").references(() => rooms.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  caption: text("caption"),
  isMain: boolean("is_main").notNull().default(false),
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Favorites for guests to save preferred rooms/properties
export const favorites = pgTable("favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  propertyId: text("property_id").references(() => properties.id),
  roomId: text("room_id").references(() => rooms.id),
  createdAt: timestamp("created_at").defaultNow()
}, (table) => ({
  uniqueUserProperty: unique().on(table.userId, table.propertyId),
  uniqueUserRoom: unique().on(table.userId, table.roomId)
}));

// Notification system
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("info"),
  isRead: boolean("is_read").notNull().default(false),
  actionUrl: text("action_url"),
  priority: text("priority").notNull().default("normal"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow()
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type UserPermission = typeof userPermissions.$inferSelect;
export type InsertUserPermission = z.infer<typeof insertUserPermissionSchema>;

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

export type AuditLogs = typeof auditLogs.$inferSelect;
export type InsertAuditLogs = z.infer<typeof insertAuditLogs>;

export type Helper = typeof helpers.$inferSelect;
export type InsertHelper = z.infer<typeof insertHelperSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type Review = typeof reviews.$inferSelect;
export type InsertReview = z.infer<typeof insertReviewSchema>;

export type PropertyPhoto = typeof propertyPhotos.$inferSelect;
export type InsertPropertyPhoto = z.infer<typeof insertPropertyPhotoSchema>;

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export const insertHelperSchema = createInsertSchema(helpers).omit({
  id: true,
  createdAt: true,
});
export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
});
export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  sentAt: true,
});
export const insertReviewSchema = createInsertSchema(reviews).omit({
  id: true,
  createdAt: true,
});
export const insertPropertyPhotoSchema = createInsertSchema(propertyPhotos).omit({
  id: true,
  uploadedAt: true,
});
export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
});
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});