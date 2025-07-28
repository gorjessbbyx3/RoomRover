import { eq, desc, and, lte, gte, or } from 'drizzle-orm';
import { db } from './db';
import { 
  users, properties, rooms, guests, bookings, payments, 
  cleaningTasks, inventory, maintenance, inquiries, auditLog, bannedUsers,
  type User, type InsertUser, type Property, type InsertProperty,
  type Room, type InsertRoom, type Guest, type InsertGuest,
  type Booking, type InsertBooking, type Payment, type InsertPayment,
  type CleaningTask, type InsertCleaningTask, type Inventory, type InsertInventory,
  type Maintenance, type InsertMaintenance, type Inquiry, type InsertInquiry
} from '../shared/schema';
import type { IStorage } from './storage';
import * as bcrypt from 'bcrypt';

export class PostgresStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
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
    const result = await db.insert(bannedUsers).values(data).returning();
    return result[0];
  }

  // Master Codes methods (placeholder - would need additional table)
  async getMasterCodes(): Promise<any[]> {
    return [];
  }

  async addMasterCode(data: { property: string; masterCode: string; notes?: string; }): Promise<any> {
    return data;
  }

  // Front Door Code Management
  async updatePropertyFrontDoorCode(propertyId: string, code: string, expiry?: Date): Promise<Property | undefined> {
    const result = await db.update(properties)
      .set({ 
        frontDoorCode: code,
        codeExpiry: expiry || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      })
      .where(eq(properties.id, propertyId))
      .returning();
    return result[0];
  }

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
        name: updates.name,
        allowedPages: updates.allowedPages
      })
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await this.db
      .delete(users)
      .where(eq(users.id, id))
      .returning();
    return result.length > 0;
  }
}