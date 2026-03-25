import { eq, desc, and, lte, gte, or, sql } from 'drizzle-orm';
import { db } from './db';
import { 
  users, properties, rooms, guests, bookings, payments, 
  cleaningTasks, inventory, maintenance, inquiries, auditLog, bannedUsers,
  favorites, notifications,
  type User, type InsertUser, type Property, type InsertProperty,
  type Room, type InsertRoom, type Guest, type InsertGuest,
  type Booking, type InsertBooking, type Payment, type InsertPayment,
  type CleaningTask, type InsertCleaningTask, type Inventory, type InsertInventory,
  type Maintenance, type InsertMaintenance, type Inquiry, type InsertInquiry
} from '../shared/schema';
import type { IStorage } from './storage';
import * as bcrypt from 'bcrypt';

// Connection pool monitoring
let connectionAttempts = 0;
const MAX_RETRIES = 3;

export class PostgresStorage implements IStorage {
  private async executeWithRetry<T>(operation: () => Promise<T>): Promise<T> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        connectionAttempts++;
        if (attempt === MAX_RETRIES) {
          console.error(`Database operation failed after ${MAX_RETRIES} attempts:`, error);
          throw new Error(`Database connection failed: ${error.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, attempt * 1000));
      }
    }
    throw new Error('Maximum retry attempts exceeded');
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.executeWithRetry(async () => {
      if (!id || typeof id !== 'string') {
        throw new Error('Invalid user ID provided');
      }
      const result = await db.select().from(users).where(eq(users.id, sql`${id}`)).limit(1);
      return result[0];
    });
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const result = await db.insert(users).values({
      ...insertUser,
      password: hashedPassword,
    }).returning();
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const updateData = { ...updates };
    if (updates.password) {
      updateData.password = await bcrypt.hash(updates.password, 10);
    }

    const result = await db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  // Property methods
  async getProperties(): Promise<Property[]> {
    return await db.select().from(properties);
  }

  async getProperty(id: string): Promise<Property | undefined> {
    const result = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
    return result[0];
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const result = await db.insert(properties).values(insertProperty).returning();
    return result[0];
  }

  async updateProperty(id: string, updates: Partial<InsertProperty>): Promise<Property | undefined> {
    const result = await db.update(properties)
      .set(updates)
      .where(eq(properties.id, id))
      .returning();
    return result[0];
  }

  // Room methods
  async getRooms(): Promise<Room[]> {
    return await db.select().from(rooms);
  }

  async getRoomsByProperty(propertyId: string): Promise<Room[]> {
    return await db.select().from(rooms).where(eq(rooms.propertyId, propertyId));
  }

  async getRoom(id: string): Promise<Room | undefined> {
    const result = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
    return result[0];
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const result = await db.insert(rooms).values(insertRoom).returning();
    return result[0];
  }

  async updateRoom(id: string, updates: Partial<InsertRoom>): Promise<Room | undefined> {
    const result = await db.update(rooms)
      .set(updates)
      .where(eq(rooms.id, id))
      .returning();
    return result[0];
  }

  async updateRoomMasterCode(roomId: string, masterCode: string): Promise<Room | null> {
    try {
      const [updatedRoom] = await db
        .update(rooms)
        .set({ masterCode })
        .where(eq(rooms.id, roomId))
        .returning();

      return updatedRoom || null;
    } catch (error) {
      console.error('Error updating room master code:', error);
      return null;
    }
  }

  // Guest methods
  async getGuests(): Promise<Guest[]> {
    return await db.select().from(guests);
  }

  async getGuest(id: string): Promise<Guest | undefined> {
    const result = await db.select().from(guests).where(eq(guests.id, id)).limit(1);
    return result[0];
  }

  async getGuestByContact(contact: string): Promise<Guest | undefined> {
    const result = await db.select().from(guests).where(eq(guests.contact, contact)).limit(1);
    return result[0];
  }

  async createGuest(insertGuest: InsertGuest): Promise<Guest> {
    const sanitizedData = {
      ...insertGuest,
      name: insertGuest.name?.toString() || '',
      contact: insertGuest.contact?.toString() || '',
      contactType: insertGuest.contactType?.toString() || 'phone',
      referralSource: insertGuest.referralSource?.toString() || null,
      cashAppTag: insertGuest.cashAppTag?.toString() || null,
      notes: insertGuest.notes?.toString() || null
    };

    const result = await db.insert(guests).values(sanitizedData).returning();
    return result[0];
  }

  async updateGuest(id: string, updates: Partial<InsertGuest>): Promise<Guest | undefined> {
    const result = await db.update(guests)
      .set(updates)
      .where(eq(guests.id, id))
      .returning();
    return result[0];
  }

  // Booking methods
  async getBookings(): Promise<Booking[]> {
    return await db.select().from(bookings);
  }

  async getBookingsByRoom(roomId: string): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.roomId, roomId));
  }

  async getBookingsByGuest(guestId: string): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.guestId, guestId));
  }

  async getActiveBookings(): Promise<Booking[]> {
    return await db.select().from(bookings).where(eq(bookings.status, 'active'));
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    return result[0];
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const result = await db.insert(bookings).values(insertBooking).returning();
    return result[0];
  }

  async updateBooking(id: string, updates: Partial<InsertBooking>): Promise<Booking | undefined> {
    const result = await db.update(bookings)
      .set(updates)
      .where(eq(bookings.id, id))
      .returning();
    return result[0];
  }

  // Payment methods
  async getPayments(): Promise<Payment[]> {
    return await db.select().from(payments);
  }

  async getPaymentsByBooking(bookingId: string): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.bookingId, bookingId));
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    const result = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
    return result[0];
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const result = await db.insert(payments).values(insertPayment).returning();
    return result[0];
  }

  // Cleaning Task methods
  async getCleaningTasks(): Promise<CleaningTask[]> {
    return await db.select().from(cleaningTasks);
  }

  async getCleaningTasksByProperty(propertyId: string): Promise<CleaningTask[]> {
    return await db.select().from(cleaningTasks).where(eq(cleaningTasks.propertyId, propertyId));
  }

  async getCleaningTasksByAssignee(userId: string): Promise<CleaningTask[]> {
    return await db.select().from(cleaningTasks).where(eq(cleaningTasks.assignedTo, userId));
  }

  async getPendingCleaningTasks(): Promise<CleaningTask[]> {
    return await db.select().from(cleaningTasks).where(eq(cleaningTasks.status, 'pending'));
  }

  async getCleaningTask(id: string): Promise<CleaningTask | undefined> {
    const result = await db.select().from(cleaningTasks).where(eq(cleaningTasks.id, id)).limit(1);
    return result[0];
  }

  async createCleaningTask(taskData: InsertCleaningTask): Promise<CleaningTask> {
    const sanitizedData = {
      ...taskData,
      title: taskData.title?.toString() || '',
      description: taskData.description?.toString() || null,
      type: taskData.type?.toString() || 'general',
      priority: taskData.priority?.toString() || 'normal',
      notes: taskData.notes?.toString() || null
    };

    const result = await db.insert(cleaningTasks).values(sanitizedData).returning();
    return result[0];
  }

  async updateCleaningTask(id: string, updates: Partial<InsertCleaningTask>): Promise<CleaningTask | undefined> {
    const result = await db.update(cleaningTasks)
      .set(updates)
      .where(eq(cleaningTasks.id, id))
      .returning();
    return result[0];
  }

  // Inventory methods
  async getInventory(): Promise<Inventory[]> {
    return await db.select().from(inventory);
  }

  async getInventoryByProperty(propertyId: string): Promise<Inventory[]> {
    return await db.select().from(inventory).where(eq(inventory.propertyId, propertyId));
  }

  async getLowStockItems(): Promise<Inventory[]> {
    return await db.select().from(inventory).where(lte(inventory.quantity, inventory.threshold));
  }

  async getInventoryItem(id: string): Promise<Inventory | undefined> {
    const result = await db.select().from(inventory).where(eq(inventory.id, id)).limit(1);
    return result[0];
  }

  async createInventoryItem(insertItem: InsertInventory): Promise<Inventory> {
    const result = await db.insert(inventory).values(insertItem).returning();
    return result[0];
  }

  async updateInventoryItem(id: string, updates: Partial<InsertInventory>): Promise<Inventory | undefined> {
    const result = await db.update(inventory)
      .set({ ...updates, lastUpdated: new Date() })
      .where(eq(inventory.id, id))
      .returning();
    return result[0];
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    const result = await db.delete(inventory).where(eq(inventory.id, id));
    return true;
  }

  // Maintenance methods
  async getMaintenance(): Promise<Maintenance[]> {
    return await db.select().from(maintenance);
  }

  async getMaintenanceByProperty(propertyId: string): Promise<Maintenance[]> {
    return await db.select().from(maintenance).where(eq(maintenance.propertyId, propertyId));
  }

  async getOpenMaintenance(): Promise<Maintenance[]> {
    return await db.select().from(maintenance).where(eq(maintenance.status, 'open'));
  }

  async getMaintenanceItem(id: string): Promise<Maintenance | undefined> {
    const result = await db.select().from(maintenance).where(eq(maintenance.id, id)).limit(1);
    return result[0];
  }

  async createMaintenanceItem(maintenanceData: InsertMaintenance): Promise<Maintenance> {
    const sanitizedData = {
      ...maintenanceData,
      issue: maintenanceData.issue?.toString() || '',
      description: maintenanceData.description?.toString() || null,
      priority: maintenanceData.priority?.toString() || 'normal',
      status: maintenanceData.status?.toString() || 'open',
      notes: maintenanceData.notes?.toString() || null,
      linkedInventoryIds: maintenanceData.linkedInventoryIds?.toString() || null
    };

    const result = await db.insert(maintenance).values(sanitizedData).returning();
    return result[0];
  }

  async updateMaintenanceItem(id: string, updates: Partial<InsertMaintenance>): Promise<Maintenance | undefined> {
    const result = await db.update(maintenance)
      .set(updates)
      .where(eq(maintenance.id, id))
      .returning();
    return result[0];
  }

  // Inquiry methods
  async getInquiries(): Promise<Inquiry[]> {
    return await db.select().from(inquiries);
  }

  async getInquiry(id: string): Promise<Inquiry | undefined> {
    const result = await db.select().from(inquiries).where(eq(inquiries.id, id)).limit(1);
    return result[0];
  }

  async getInquiryByToken(token: string): Promise<Inquiry | undefined> {
    const result = await db.select().from(inquiries).where(eq(inquiries.trackerToken, token)).limit(1);
    return result[0];
  }

  async createInquiry(insertInquiry: InsertInquiry): Promise<Inquiry> {
    const trackerToken = crypto.randomUUID();
    const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const result = await db.insert(inquiries).values({
      ...insertInquiry,
      trackerToken,
      tokenExpiry,
    }).returning();
    return result[0];
  }

  async updateInquiry(id: string, updates: Partial<InsertInquiry>): Promise<Inquiry | undefined> {
    const result = await db.update(inquiries)
      .set(updates)
      .where(eq(inquiries.id, id))
      .returning();
    return result[0];
  }

  // Banned Users methods
  async checkBannedUser(email: string): Promise<any> {
    const result = await db.select().from(bannedUsers).where(eq(bannedUsers.email, email)).limit(1);
    return result[0];
  }

  async addToBannedList(data: { name: string; phone?: string; email?: string; reason: string; }): Promise<any> {
    const result = await db.insert(bannedUsers).values({
      email: data.email || '',
      reason: data.reason,
      bannedBy: 'system', // Default value
      name: data.name,
      phone: data.phone,
    }).returning();
    return result[0];
  }

  // Master Codes methods (placeholder - would need additional table)
  async getMasterCodes(): Promise<any[]> {
    return [];
  }

  async addMasterCode(data: { property: string; masterCode: string; notes?: string; }): Promise<any> {
    return data;
  }

  // Front Door Code Management - first implementation

  // Additional methods for cash management, audit logs, etc.
  async createAuditLog(data: { userId: string; action: string; details: string }): Promise<any> {
    const result = await db.insert(auditLog).values(data).returning();
    return result[0];
  }

  // Placeholder methods for cash management (would need additional tables)
  async getCashTurnIns(): Promise<any[]> { return []; }
  async getCashTurnInsByManager(managerId: string): Promise<any[]> { return []; }
  async createCashTurnIn(data: any): Promise<any> { return data; }
  async getAdminDrawerTransactions(): Promise<any[]> { return []; }
  async createAdminDrawerTransaction(data: any): Promise<any> { return data; }
  async getHouseBankTransactions(): Promise<any[]> { return []; }
  async createHouseBankTransaction(data: any): Promise<any> { return data; }
  async getHouseBankStats(): Promise<any> { return {}; }
  async getAdminDrawerStats(): Promise<any> { return {}; }
  async getCashDrawerStats(): Promise<any[]> { return []; }
  async getBannedUsers(): Promise<any[]> { 
    return await db.select().from(bannedUsers);
  }
  async createBannedUser(data: any): Promise<any> {
    const result = await db.insert(bannedUsers).values(data).returning();
    return result[0];
  }
  async deleteBannedUser(id: string): Promise<boolean> {
    const result = await db.delete(bannedUsers).where(eq(bannedUsers.id, id));
    return true;
  }
  async updateUserPassword(id: string, hashedPassword: string): Promise<boolean> {
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, id));
    return true;
  }
  async updateUserPrivileges(id: string, updates: { role: string; property: string | null }): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ 
        role: updates.role as any, 
        property: updates.property,
        // Additional fields would be added here based on user schema
      })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async getUserPermissions(userId: string): Promise<any[]> {
    // This would need a separate permissions table in a real implementation
    return [];
  }

  async updateUserPermissions(userId: string, permissions: any[]): Promise<boolean> {
    // This would need a separate permissions table in a real implementation
    return true;
  }

  async getUserWithPermissions(userId: string): Promise<any> {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    
    const permissions = await this.getUserPermissions(userId);
    return { ...user, permissions };
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning();
    return result.length > 0;
  }

  // Duplicate method removed - using first implementation above

  // Helper management methods
  async getHelpers(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, 'helper'));
  }

  async getHelpersByProperty(propertyId: string): Promise<User[]> {
    return await db.select().from(users).where(and(eq(users.role, 'helper'), eq(users.property, propertyId)));
  }

  async createHelper(insertUser: InsertUser): Promise<User> {
    return await this.createUser({ ...insertUser, role: 'helper' });
  }

  // Task management methods (using cleaning tasks as the base)
  async getTasks(): Promise<CleaningTask[]> {
    return await db.select().from(cleaningTasks);
  }

  async getTasksByProperty(propertyId: string): Promise<CleaningTask[]> {
    return await db.select().from(cleaningTasks).where(eq(cleaningTasks.propertyId, propertyId));
  }

  async getTasksByHelper(userId: string): Promise<CleaningTask[]> {
    return await db.select().from(cleaningTasks).where(eq(cleaningTasks.assignedTo, userId));
  }

  async createTask(task: any): Promise<CleaningTask> {
    return await this.createCleaningTask(task);
  }

  // Messaging methods - these would require implementing the full messaging schema
  async getMessages(userId: string): Promise<any[]> {
    // For now return empty array - would need full messaging implementation
    return [];
  }

  async createMessage(message: any): Promise<any> {
    // For now return the message - would need full messaging implementation
    return message;
  }

  async getConversation(userId1: string, userId2: string): Promise<any[]> {
    // For now return empty array - would need full messaging implementation
    return [];
  }

  // Reviews methods - these would require implementing the full reviews schema
  async getReviews(): Promise<any[]> {
    // For now return empty array - would need full reviews implementation
    return [];
  }

  async createReview(review: any): Promise<any> {
    // For now return the review - would need full reviews implementation
    return review;
  }

  // Property photos methods
  async getPropertyPhotos(propertyId: string): Promise<any[]> {
    // For now return empty array - would need full photo implementation
    return [];
  }

  async createPropertyPhoto(photo: any): Promise<any> {
    // For now return the photo - would need full photo implementation
    return photo;
  }

  // Favorites methods
  async getFavorites(userId: string): Promise<any[]> {
    return await db.select().from(favorites).where(eq(favorites.userId, userId));
  }

  async createFavorite(favorite: any): Promise<any> {
    const result = await db.insert(favorites).values(favorite).returning();
    return result[0];
  }

  async deleteFavorite(id: string): Promise<boolean> {
    const result = await db.delete(favorites).where(eq(favorites.id, id)).returning();
    return result.length > 0;
  }

  // Memberships - stored via bookings with isTenant flag
  async getMemberships(userId: string): Promise<any[]> {
    return await db.select().from(bookings).where(eq(bookings.isTenant, true));
  }

  async createMembership(membership: any): Promise<any> {
    return membership;
  }

  async updateMembership(id: string, updates: any): Promise<any> {
    return updates;
  }

  async deleteMembership(id: string): Promise<boolean> {
    return true;
  }

  // Notifications methods
  async getNotifications(userId: string): Promise<any[]> {
    return await db.select().from(notifications).where(eq(notifications.userId, userId)).orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(id: string): Promise<boolean> {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
    return true;
  }

  async createNotification(data: any): Promise<any> {
    const result = await db.insert(notifications).values(data).returning();
    return result[0];
  }

  // Additional maintenance methods
  async getMaintenanceByRoom(roomId: string): Promise<Maintenance[]> {
    return await db.select().from(maintenance).where(eq(maintenance.roomId, roomId));
  }

  // --- BOOKING MANAGEMENT (missing methods) ---

  async getBookingsForRoom(roomId: string, start: any, end: any): Promise<Booking[]> {
    const startDate = start ? new Date(start as string) : new Date();
    const endDate = end ? new Date(end as string) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    
    return await db.select().from(bookings).where(
      and(
        eq(bookings.roomId, roomId),
        eq(bookings.status, 'active'),
        or(
          and(lte(bookings.startDate, endDate), gte(bookings.endDate, startDate)),
          and(lte(bookings.startDate, endDate), gte(bookings.startDate, startDate))
        )
      )
    );
  }

  async cancelBooking(bookingId: string, userId: string): Promise<Booking | undefined> {
    const booking = await this.getBooking(bookingId);
    if (!booking) return undefined;

    const result = await db.update(bookings)
      .set({ status: 'cancelled' })
      .where(eq(bookings.id, bookingId))
      .returning();

    // Free up the room
    if (booking.roomId) {
      await db.update(rooms).set({ status: 'available' }).where(eq(rooms.id, booking.roomId));
    }

    await this.createAuditLog({ userId, action: 'booking_cancelled', details: `Booking ${bookingId} cancelled` });
    return result[0];
  }

  async checkInGuest(bookingId: string, userId: string): Promise<boolean> {
    const booking = await this.getBooking(bookingId);
    if (!booking) return false;

    await db.update(bookings).set({ status: 'active' }).where(eq(bookings.id, bookingId));
    await db.update(rooms).set({ status: 'occupied' }).where(eq(rooms.id, booking.roomId));
    await this.createAuditLog({ userId, action: 'guest_checked_in', details: `Guest checked in for booking ${bookingId}` });
    return true;
  }

  async checkOutGuest(bookingId: string, userId: string): Promise<boolean> {
    const booking = await this.getBooking(bookingId);
    if (!booking) return false;

    await db.update(bookings).set({ status: 'completed' }).where(eq(bookings.id, bookingId));
    await db.update(rooms).set({ status: 'cleaning', cleaningStatus: 'dirty' }).where(eq(rooms.id, booking.roomId));
    await this.createAuditLog({ userId, action: 'guest_checked_out', details: `Guest checked out for booking ${bookingId}` });
    return true;
  }

  async recordExternalPayment(data: { bookingId: string; amount: string; method: string; reference: string }): Promise<any> {
    const booking = await this.getBooking(data.bookingId);
    if (!booking) throw new Error('Booking not found');

    const result = await db.insert(payments).values({
      bookingId: data.bookingId,
      amount: data.amount,
      method: data.method,
      transactionId: data.reference,
      dateReceived: new Date(),
      receivedBy: 'system',
      totalPaid: data.amount,
    }).returning();
    return result[0];
  }

  async addBookingNote(bookingId: string, userId: string, note: string): Promise<any> {
    await this.createAuditLog({ userId, action: 'booking_note', details: `[Booking ${bookingId}] ${note}` });
    return { bookingId, userId, note, createdAt: new Date() };
  }

  async getBookingNotes(bookingId: string): Promise<any[]> {
    const logs = await db.select().from(auditLog)
      .where(and(eq(auditLog.action, 'booking_note'), sql`${auditLog.details} LIKE ${'%' + bookingId + '%'}`))
      .orderBy(desc(auditLog.timestamp));
    return logs.map(l => ({ id: l.id, userId: l.userId, note: l.details, createdAt: l.timestamp }));
  }

  async getBookingAttachments(bookingId: string): Promise<any[]> {
    return []; // File upload not yet implemented
  }

  async getBookingAuditTrail(bookingId: string): Promise<any[]> {
    return await db.select().from(auditLog)
      .where(sql`${auditLog.details} LIKE ${'%' + bookingId + '%'}`)
      .orderBy(desc(auditLog.timestamp));
  }

  // --- TASK MANAGEMENT (missing methods) ---

  async assignHelperToTask(taskId: string, helperId: string, assignerId: string): Promise<any> {
    await db.update(cleaningTasks).set({ assignedTo: helperId }).where(eq(cleaningTasks.id, taskId));
    await this.createAuditLog({ userId: assignerId, action: 'task_assigned', details: `Task ${taskId} assigned to ${helperId}` });
    return { taskId, helperId, assignedBy: assignerId };
  }

  async unassignHelperFromTask(taskId: string, helperId: string, assignerId: string): Promise<any> {
    await db.update(cleaningTasks).set({ assignedTo: null }).where(eq(cleaningTasks.id, taskId));
    await this.createAuditLog({ userId: assignerId, action: 'task_unassigned', details: `Task ${taskId} unassigned from ${helperId}` });
    return { taskId, helperId, unassignedBy: assignerId };
  }

  async addTaskComment(taskId: string, userId: string, comment: string): Promise<any> {
    await this.createAuditLog({ userId, action: 'task_comment', details: `[Task ${taskId}] ${comment}` });
    return { taskId, userId, comment, createdAt: new Date() };
  }

  async getTaskComments(taskId: string): Promise<any[]> {
    const logs = await db.select().from(auditLog)
      .where(and(eq(auditLog.action, 'task_comment'), sql`${auditLog.details} LIKE ${'%' + taskId + '%'}`))
      .orderBy(desc(auditLog.timestamp));
    return logs.map(l => ({ id: l.id, userId: l.userId, comment: l.details, createdAt: l.timestamp }));
  }

  async getTaskAttachments(taskId: string): Promise<any[]> {
    return [];
  }

  async getTaskAuditTrail(taskId: string): Promise<any[]> {
    return await db.select().from(auditLog)
      .where(sql`${auditLog.details} LIKE ${'%' + taskId + '%'}`)
      .orderBy(desc(auditLog.timestamp));
  }

  // --- PAYMENT (missing methods) ---

  async createPaymentDispute(paymentId: string, userId: string, reason: string): Promise<any> {
    await this.createAuditLog({ userId, action: 'payment_dispute', details: `Payment ${paymentId} disputed: ${reason}` });
    return { paymentId, userId, reason, status: 'open', createdAt: new Date() };
  }

  // --- ANALYTICS (missing methods) ---

  async getAnalyticsWidgets(role: string, property: string | null): Promise<any> {
    const totalBookings = await db.select().from(bookings);
    const activeBookings = totalBookings.filter(b => b.status === 'active');
    const allPayments = await db.select().from(payments);
    const totalRevenue = allPayments.reduce((sum, p) => sum + parseFloat(p.totalPaid || '0'), 0);
    const allRooms = await db.select().from(rooms);
    const occupiedRooms = allRooms.filter(r => r.status === 'occupied');
    const occupancyRate = allRooms.length > 0 ? (occupiedRooms.length / allRooms.length) * 100 : 0;

    return {
      totalBookings: totalBookings.length,
      activeBookings: activeBookings.length,
      totalRevenue: totalRevenue.toFixed(2),
      occupancyRate: occupancyRate.toFixed(1),
      totalRooms: allRooms.length,
      occupiedRooms: occupiedRooms.length,
    };
  }

  // --- USER MANAGEMENT (missing methods) ---

  async switchUserRole(userId: string, role: string, property: string | null): Promise<User | undefined> {
    const result = await db.update(users)
      .set({ role, property })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async updateUserProfile(userId: string, data: any): Promise<User | undefined> {
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.username) updateData.username = data.username;

    const result = await db.update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  }

  async getUserActivityLog(userId: string): Promise<any[]> {
    return await db.select().from(auditLog)
      .where(eq(auditLog.userId, userId))
      .orderBy(desc(auditLog.timestamp))
      .limit(50);
  }

  // --- INVENTORY (missing methods) ---

  async createInventoryUsage(itemId: string, userId: string, amount: number, notes: string): Promise<any> {
    const item = await this.getInventoryItem(itemId);
    if (!item) throw new Error('Item not found');

    const newQuantity = Math.max(0, item.quantity - amount);
    await this.updateInventoryItem(itemId, { quantity: newQuantity });
    await this.createAuditLog({ userId, action: 'inventory_usage', details: `Used ${amount} of ${item.item}. ${notes || ''}` });
    return { itemId, userId, amount, newQuantity, notes };
  }

  async createInventoryRestockRequest(itemId: string, userId: string, amount: number, notes: string): Promise<any> {
    const item = await this.getInventoryItem(itemId);
    if (!item) throw new Error('Item not found');

    const newQuantity = item.quantity + amount;
    await this.updateInventoryItem(itemId, { quantity: newQuantity });
    await this.createAuditLog({ userId, action: 'inventory_restock', details: `Restocked ${amount} of ${item.item}. ${notes || ''}` });
    return { itemId, userId, amount, newQuantity, notes };
  }

  // --- MAINTENANCE (missing methods) ---

  async createMaintenanceSchedule(maintenanceId: string, userId: string, date: string, notes: string): Promise<any> {
    await this.updateMaintenanceItem(maintenanceId, { dueDate: new Date(date), status: 'open' } as any);
    await this.createAuditLog({ userId, action: 'maintenance_scheduled', details: `Maintenance ${maintenanceId} scheduled for ${date}. ${notes || ''}` });
    return { maintenanceId, scheduledDate: date, notes };
  }

  async completeMaintenance(maintenanceId: string, userId: string, notes: string): Promise<any> {
    const result = await db.update(maintenance)
      .set({ status: 'completed', dateCompleted: new Date() } as any)
      .where(eq(maintenance.id, maintenanceId))
      .returning();
    await this.createAuditLog({ userId, action: 'maintenance_completed', details: `Maintenance ${maintenanceId} completed. ${notes || ''}` });
    return result[0];
  }

  // --- PROPERTY (missing methods) ---

  async updatePropertyFrontDoorCode(propertyId: string, code: string, expiry?: Date): Promise<Property | undefined> {
    const result = await db.update(properties)
      .set({
        frontDoorCode: code,
        codeExpiry: expiry || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      })
      .where(eq(properties.id, propertyId))
      .returning();
    return result[0];
  }
}