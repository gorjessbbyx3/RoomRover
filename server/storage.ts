import { 
  type User, 
  type InsertUser,
  type Property,
  type InsertProperty,
  type Room,
  type InsertRoom,
  type Guest,
  type InsertGuest,
  type Booking,
  type InsertBooking,
  type Payment,
  type InsertPayment,
  type CleaningTask,
  type InsertCleaningTask,
  type Inventory,
  type InsertInventory,
  type Maintenance,
  type InsertMaintenance,
  type Inquiry,
  type InsertInquiry
} from "@shared/schema";
import { randomUUID } from "crypto";
import * as bcrypt from "bcrypt";

// Only import database dependencies if DATABASE_URL is available
let db: any = null;
const databaseUrl = process.env.DATABASE_URL;

if (databaseUrl) {
  try {
    const { drizzle } = await import("drizzle-orm/neon-http");
    const { neon } = await import("@neondatabase/serverless");
    const schema = await import("../shared/schema");

    // Verify we're not using localhost
    if (databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')) {
      console.warn("DATABASE_URL is pointing to localhost. Using in-memory storage instead.");
    } else {
      console.log('Storage connecting to database:', databaseUrl.replace(/:([^:@]{1,}@)/, ':***@'));
      const sql = neon(databaseUrl);
      db = drizzle(sql, { schema });
    }
  } catch (error) {
    console.warn('Database connection failed, using in-memory storage:', error);
  }
}

export type DB = typeof db;

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined>;

  // Properties
  getProperties(): Promise<Property[]>;
  getProperty(id: string): Promise<Property | undefined>;
  createProperty(property: InsertProperty): Promise<Property>;
  updateProperty(id: string, updates: Partial<InsertProperty>): Promise<Property | undefined>;

  // Rooms
  getRooms(): Promise<Room[]>;
  getRoomsByProperty(propertyId: string): Promise<Room[]>;
  getRoom(id: string): Promise<Room | undefined>;
  createRoom(room: InsertRoom): Promise<Room>;
  updateRoom(id: string, updates: Partial<InsertRoom>): Promise<Room | undefined>;

  // Guests
  getGuests(): Promise<Guest[]>;
  getGuest(id: string): Promise<Guest | undefined>;
  getGuestByContact(contact: string): Promise<Guest | undefined>;
  createGuest(guest: InsertGuest): Promise<Guest>;
  updateGuest(id: string, updates: Partial<InsertGuest>): Promise<Guest | undefined>;

  // Bookings
  getBookings(): Promise<Booking[]>;
  getBookingsByRoom(roomId: string): Promise<Room[]>;
  getBookingsByGuest(guestId: string): Promise<Booking[]>;
  getActiveBookings(): Promise<Booking[]>;
  getBooking(id: string): Promise<Booking | undefined>;
  createBooking(booking: InsertBooking): Promise<Booking>;
  updateBooking(id: string, updates: Partial<InsertBooking>): Promise<Booking | undefined>;

  // Payments
  getPayments(): Promise<Payment[]>;
  getPaymentsByBooking(bookingId: string): Promise<Payment[]>;
  getPayment(id: string): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;

  // Cleaning Tasks
  getCleaningTasks(): Promise<CleaningTask[]>;
  getCleaningTasksByProperty(propertyId: string): Promise<CleaningTask[]>;
  getCleaningTasksByAssignee(userId: string): Promise<CleaningTask[]>;
  getPendingCleaningTasks(): Promise<CleaningTask[]>;
  getCleaningTask(id: string): Promise<CleaningTask | undefined>;
  createCleaningTask(task: InsertCleaningTask): Promise<CleaningTask>;
  updateCleaningTask(id: string, updates: Partial<InsertCleaningTask>): Promise<CleaningTask | undefined>;

  // Inventory
  getInventory(): Promise<Inventory[]>;
  getInventoryByProperty(propertyId: string): Promise<Inventory[]>;
  getLowStockItems(): Promise<Inventory[]>;
  getInventoryItem(id: string): Promise<Inventory | undefined>;
  createInventoryItem(item: InsertInventory): Promise<Inventory>;
  updateInventoryItem(id: string, updates: Partial<InsertInventory>): Promise<Inventory | undefined>;
  deleteInventoryItem(id: string): Promise<boolean>;

  // Maintenance
  getMaintenance(): Promise<Maintenance[]>;
  getMaintenanceByProperty(propertyId: string): Promise<Maintenance[]>;
  getOpenMaintenance(): Promise<Maintenance[]>;
  getMaintenanceItem(id: string): Promise<Maintenance | undefined>;
  createMaintenanceItem(item: InsertMaintenance): Promise<Maintenance>;
  updateMaintenanceItem(id: string, updates: Partial<InsertMaintenance>): Promise<Maintenance | undefined>;

  // Inquiries
  getInquiries(): Promise<Inquiry[]>;
  getInquiry(id: string): Promise<Inquiry | undefined>;
  getInquiryByToken(token: string): Promise<Inquiry | undefined>;
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  updateInquiry(id: string, updates: Partial<InsertInquiry>): Promise<Inquiry | undefined>;

    // Banned Users
  checkBannedUser(email: string): Promise<any>;
  addToBannedList(data: {name: string; phone?: string; email?: string; reason: string;}): Promise<any>;

  // Master Codes
  getMasterCodes(): Promise<any[]>;
  addMasterCode(data: {property: string; masterCode: string; notes?: string;}): Promise<any>;

  // Front Door Code Management
  updatePropertyFrontDoorCode(propertyId: string, code: string, expiry?: Date): Promise<Property | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private properties: Map<string, Property> = new Map();
  private rooms: Map<string, Room> = new Map();
  private guests: Map<string, Guest> = new Map();
  private bookings: Map<string, Booking> = new Map();
  private payments: Map<string, Payment> = new Map();
  private cleaningTasks: Map<string, CleaningTask> = new Map();
  private inventory: Map<string, Inventory> = new Map();
  private maintenance: Map<string, Maintenance> = new Map();
  private inquiries: Map<string, Inquiry> = new Map();
  private bannedList: Map<string, any> = new Map();
  private masterCodes: Map<string, any> = new Map();

  constructor() {
    this.initializeData();
  }

  private async initializeData() {
    // Create default admin user
    const adminPassword = await bcrypt.hash("admin123", 10);
    const admin: User = {
      id: randomUUID(),
      username: "admin",
      password: adminPassword,
      role: "admin",
      property: null,
      name: "Admin User",
      createdAt: new Date(),
    };
    this.users.set(admin.id, admin);

    // Create property managers
    const p1ManagerPassword = await bcrypt.hash("p1manager123", 10);
    const p1Manager: User = {
      id: randomUUID(),
      username: "p1manager",
      password: p1ManagerPassword,
      role: "manager",
      property: "P1",
      name: "P1 Manager",
      createdAt: new Date(),
    };
    this.users.set(p1Manager.id, p1Manager);

    const p2ManagerPassword = await bcrypt.hash("p2manager123", 10);
    const p2Manager: User = {
      id: randomUUID(),
      username: "p2manager",
      password: p2ManagerPassword,
      role: "manager",
      property: "P2",
      name: "P2 Manager",
      createdAt: new Date(),
    };
    this.users.set(p2Manager.id, p2Manager);

    // Create helper user
    const helperPassword = await bcrypt.hash("helper123", 10);
    const helper: User = {
      id: randomUUID(),
      username: "helper",
      password: helperPassword,
      role: "helper",
      property: null,
      name: "Cleaning Helper",
      createdAt: new Date(),
    };
    this.users.set(helper.id, helper);

    // Create properties
    const p1: Property = {
      id: "P1",
      name: "Premium Location",
      description: "8 Rooms • Premium location with higher rates",
      frontDoorCode: "1234",
      codeExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      rateDaily: "100.00",
      rateWeekly: "500.00",
      rateMonthly: "2000.00",
    };
    this.properties.set(p1.id, p1);

    const p2: Property = {
      id: "P2",
      name: "Value Location",
      description: "10 Rooms • Value location with competitive rates",
      frontDoorCode: "5678",
      codeExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      rateDaily: "60.00",
      rateWeekly: "300.00",
      rateMonthly: "1200.00",
    };
    this.properties.set(p2.id, p2);

    // Create rooms for P1 (8 rooms)
    for (let i = 1; i <= 8; i++) {
      const room: Room = {
        id: `P1-R${i}`,
        propertyId: "P1",
        roomNumber: i,
        status: "available",
        doorCode: null,
        codeExpiry: null,
        cleaningStatus: "clean",
        linenStatus: "fresh",
        lastCleaned: new Date(),
        lastLinenChange: new Date(),
        notes: null,
      };
      this.rooms.set(room.id, room);
    }

    // Create rooms for P2 (10 rooms)
    for (let i = 1; i <= 10; i++) {
      const room: Room = {
        id: `P2-R${i}`,
        propertyId: "P2",
        roomNumber: i,
        status: "available",
        doorCode: null,
        codeExpiry: null,
        cleaningStatus: "clean",
        linenStatus: "fresh",
        lastCleaned: new Date(),
        lastLinenChange: new Date(),
        notes: null,
      };
      this.rooms.set(room.id, room);
    }

    // Add some sample inventory items
    const p1Inventory: Inventory[] = [
      {
        id: randomUUID(),
        propertyId: "P1",
        item: "Sheet Sets",
        quantity: 20,
        threshold: 10,
        unit: "sets",
        notes: null,
        lastUpdated: new Date(),
      },
      {
        id: randomUUID(),
        propertyId: "P1",
        item: "Towels",
        quantity: 30,
        threshold: 15,
        unit: "pieces",
        notes: null,
        lastUpdated: new Date(),
      },
    ];

    const p2Inventory: Inventory[] = [
      {
        id: randomUUID(),
        propertyId: "P2",
        item: "Sheet Sets",
        quantity: 25,
        threshold: 12,
        unit: "sets",
        notes: null,
        lastUpdated: new Date(),
      },
      {
        id: randomUUID(),
        propertyId: "P2",
        item: "Towels",
        quantity: 35,
        threshold: 18,
        unit: "pieces",
        notes: null,
        lastUpdated: new Date(),
      },
    ];

    [...p1Inventory, ...p2Inventory].forEach(item => {
      this.inventory.set(item.id, item);
    });
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user: User = {
      id,
      role: insertUser.role,
      property: insertUser.property ?? null,
      name: insertUser.name,
      username: insertUser.username,
      password: hashedPassword,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates };
    if (updates.password) {
      updatedUser.password = await bcrypt.hash(updates.password, 10);
    }

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Property methods
  async getProperties(): Promise<Property[]> {
    return Array.from(this.properties.values());
  }

  async getProperty(id: string): Promise<Property | undefined> {
    return this.properties.get(id);
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const property: Property = {
      id: insertProperty.id,
      name: insertProperty.name,
      description: insertProperty.description ?? null,
      frontDoorCode: insertProperty.frontDoorCode ?? null,
      codeExpiry: insertProperty.codeExpiry ?? null,
      rateDaily: insertProperty.rateDaily,
      rateWeekly: insertProperty.rateWeekly,
      rateMonthly: insertProperty.rateMonthly,
    };
    this.properties.set(property.id, property);
    return property;
  }

  async updateProperty(id: string, updates: Partial<InsertProperty>): Promise<Property | undefined> {
    const property = this.properties.get(id);
    if (!property) return undefined;

    const updatedProperty = { ...property, ...updates };
    this.properties.set(id, updatedProperty);
    return updatedProperty;
  }

  // Room methods
  async getRooms(): Promise<Room[]> {
    return Array.from(this.rooms.values());
  }

  async getRoomsByProperty(propertyId: string): Promise<Room[]> {
    return Array.from(this.rooms.values()).filter(room => room.propertyId === propertyId);
  }

  async getRoom(id: string): Promise<Room | undefined> {
    return this.rooms.get(id);
  }

  async createRoom(insertRoom: InsertRoom): Promise<Room> {
    const room: Room = {
      id: insertRoom.id,
      status: insertRoom.status ?? 'available',
      codeExpiry: insertRoom.codeExpiry ?? null,
      propertyId: insertRoom.propertyId,
      roomNumber: insertRoom.roomNumber,
      doorCode: insertRoom.doorCode ?? null,
      cleaningStatus: insertRoom.cleaningStatus ?? 'clean',
      linenStatus: insertRoom.linenStatus ?? 'clean',
      lastCleaned: insertRoom.lastCleaned ?? null,
      lastLinenChange: insertRoom.lastLinenChange ?? null,
      notes: insertRoom.notes ?? null,
    };
    this.rooms.set(room.id, room);
    return room;
  }

  async updateRoom(id: string, updates: Partial<InsertRoom>): Promise<Room | undefined> {
    const room = this.rooms.get(id);
    if (!room) return undefined;

    const updatedRoom = { ...room, ...updates };
    this.rooms.set(id, updatedRoom);
    return updatedRoom;
  }

  // Guest methods
  async getGuests(): Promise<Guest[]> {
    return Array.from(this.guests.values());
  }

  async getGuest(id: string): Promise<Guest | undefined> {
    return this.guests.get(id);
  }

  async getGuestByContact(contact: string): Promise<Guest | undefined> {
    return Array.from(this.guests.values()).find(guest => guest.contact === contact);
  }

  async createGuest(insertGuest: InsertGuest): Promise<Guest> {
    const id = randomUUID();
    const guest: Guest = {
      ...insertGuest,
      id,
      createdAt: new Date(),
    };
    this.guests.set(id, guest);
    return guest;
  }

  async updateGuest(id: string, updates: Partial<InsertGuest>): Promise<Guest | undefined> {
    const guest = this.guests.get(id);
    if (!guest) return undefined;

    const updatedGuest = { ...guest, ...updates };
    this.guests.set(id, updatedGuest);
    return updatedGuest;
  }

  // Booking methods
  async getBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values());
  }

  async getBookingsByRoom(roomId: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => booking.roomId === roomId);
  }

  async getBookingsByGuest(guestId: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => booking.guestId === guestId);
  }

  async getActiveBookings(): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => booking.status === "active");
  }

  async getBooking(id: string): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = randomUUID();
    const booking: Booking = {
      ...insertBooking,
      id,
      createdAt: new Date(),
    };
    this.bookings.set(id, booking);
    return booking;
  }

  async updateBooking(id: string, updates: Partial<InsertBooking>): Promise<Booking | undefined> {
    const booking = this.bookings.get(id);
    if (!booking) return undefined;

    const updatedBooking = { ...booking, ...updates };
    this.bookings.set(id, updatedBooking);
    return updatedBooking;
  }

  // Payment methods
  async getPayments(): Promise<Payment[]> {
    return Array.from(this.payments.values());
  }

  async getPaymentsByBooking(bookingId: string): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(payment => payment.bookingId === bookingId);
  }

  async getPayment(id: string): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = randomUUID();
    const payment: Payment = {
      ...insertPayment,
      id,
      discountAmount: insertPayment.discountAmount || '0.00',
      discountReason: insertPayment.discountReason || null,
      hasSecurityDeposit: insertPayment.hasSecurityDeposit || false,
      securityDepositAmount: insertPayment.securityDepositAmount || '0.00',
      securityDepositDiscount: insertPayment.securityDepositDiscount || '0.00',
      hasPetFee: insertPayment.hasPetFee || false,
      petFeeAmount: insertPayment.petFeeAmount || '0.00',
      petFeeDiscount: insertPayment.petFeeDiscount || '0.00',
      totalPaid: insertPayment.totalPaid || insertPayment.amount,
      createdAt: new Date(),
    };
    this.payments.set(id, payment);
    return payment;
  }

  // Cleaning Task methods
  async getCleaningTasks(): Promise<CleaningTask[]> {
    return Array.from(this.cleaningTasks.values());
  }

  async getCleaningTasksByProperty(propertyId: string): Promise<CleaningTask[]> {
    return Array.from(this.cleaningTasks.values()).filter(task => task.propertyId === propertyId);
  }

  async getCleaningTasksByAssignee(userId: string): Promise<CleaningTask[]> {
    return Array.from(this.cleaningTasks.values()).filter(task => task.assignedTo === userId);
  }

  async getPendingCleaningTasks(): Promise<CleaningTask[]> {
    return Array.from(this.cleaningTasks.values()).filter(task => task.status === "pending");
  }

  async getCleaningTask(id: string): Promise<CleaningTask | undefined> {
    return this.cleaningTasks.get(id);
  }

  async createCleaningTask(insertTask: InsertCleaningTask): Promise<CleaningTask> {
    const id = randomUUID();
    const task: CleaningTask = {
      ...insertTask,
      id,
      createdAt: new Date(),
    };
    this.cleaningTasks.set(id, task);
    return task;
  }

  async updateCleaningTask(id: string, updates: Partial<InsertCleaningTask>): Promise<CleaningTask | undefined> {
    const task = this.cleaningTasks.get(id);
    if (!task) return undefined;

    const updatedTask = { ...task, ...updates };
    this.cleaningTasks.set(id, updatedTask);
    return updatedTask;
  }





  // Inventory methods
  async getInventory(): Promise<Inventory[]> {
    return Array.from(this.inventory.values());
  }

  async getInventoryByProperty(propertyId: string): Promise<Inventory[]> {
    return Array.from(this.inventory.values()).filter(item => item.propertyId === propertyId);
  }

  async getLowStockItems(): Promise<Inventory[]> {
    return Array.from(this.inventory.values()).filter(item => item.quantity <= item.threshold);
  }

  async getInventoryItem(id: string): Promise<Inventory | undefined> {
    return this.inventory.get(id);
  }

  async createInventoryItem(insertItem: InsertInventory): Promise<Inventory> {
    const id = randomUUID();
    const item: Inventory = {
      ...insertItem,
      id,
      lastUpdated: new Date(),
    };
    this.inventory.set(id, item);
    return item;
  }

  async updateInventoryItem(id: string, updates: Partial<InsertInventory>): Promise<Inventory | undefined> {
    const item = this.inventory.get(id);
    if (!item) return undefined;

    const updatedItem = { ...item, ...updates, lastUpdated: new Date() };
    this.inventory.set(id, updatedItem);
    return updatedItem;
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    return this.inventory.delete(id);
  }

  async deleteInventoryItem(id: string): Promise<boolean> {
    return this.inventory.delete(id);
  }

  // Maintenance methods
  async getMaintenance(): Promise<Maintenance[]> {
    return Array.from(this.maintenance.values());
  }

  async getMaintenanceByProperty(propertyId: string): Promise<Maintenance[]> {
    return Array.from(this.maintenance.values()).filter(item => item.propertyId === propertyId);
  }

  async getOpenMaintenance(): Promise<Maintenance[]> {
    return Array.from(this.maintenance.values()).filter(item => item.status === "open");
  }

  async getMaintenanceItem(id: string): Promise<Maintenance | undefined> {
    return this.maintenance.get(id);
  }

  async createMaintenanceItem(insertItem: InsertMaintenance): Promise<Maintenance> {
    const id = randomUUID();
    const item: Maintenance = {
      ...insertItem,
      id,
      dateReported: new Date(),
    };
    this.maintenance.set(id, item);
    return item;
  }

  async updateMaintenanceItem(id: string, updates: Partial<InsertMaintenance>): Promise<Maintenance | undefined> {
    const item = this.maintenance.get(id);
    if (!item) return undefined;

    // Validate priority if being updated
    if (updates.priority && !['low', 'medium', 'high', 'critical'].includes(updates.priority)) {
      throw new Error('Invalid priority value');
    }

    // Validate status if being updated
    if (updates.status && !['open', 'in_progress', 'completed'].includes(updates.status)) {
      throw new Error('Invalid status value');
    }

    const updatedItem = { ...item, ...updates };
    this.maintenance.set(id, updatedItem);
    return updatedItem;
  }

  // Inquiry methods
  async getInquiries(): Promise<Inquiry[]> {
    return Array.from(this.inquiries.values());
  }

  async getInquiry(id: string): Promise<Inquiry | undefined> {
    return this.inquiries.get(id);
  }

  async getInquiryByToken(token: string): Promise<Inquiry | undefined> {
    return Array.from(this.inquiries.values()).find(inquiry => inquiry.trackerToken === token);
  }

  async createInquiry(insertInquiry: InsertInquiry): Promise<Inquiry> {
    const id = randomUUID();
    const trackerToken = randomUUID();
    const tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const inquiry: Inquiry = {
      ...insertInquiry,
      id,
      trackerToken,
      tokenExpiry,
      createdAt: new Date(),
    };
    this.inquiries.set(id, inquiry);
    return inquiry;
  }

  async updateInquiry(id: string, updates: Partial<InsertInquiry>): Promise<Inquiry | undefined> {
    const inquiry = this.inquiries.get(id);
    if (!inquiry) return undefined;

    const updatedInquiry = { ...inquiry, ...updates };
    this.inquiries.set(id, updatedInquiry);
    return updatedInquiry;
  }

  async checkBannedUser(email: string) {
    return Array.from(this.bannedList.values()).find(bannedUser => bannedUser.email === email);
  }

  async addToBannedList(data: {
    name: string;
    phone?: string;
    email?: string;
    reason: string;
  }) {
    const id = randomUUID();
    const bannedUser = {
      id,
      ...data,
      bannedDate: new Date(),
    };
    this.bannedList.set(id, bannedUser);
    return bannedUser;
  }

  async getMasterCodes(): Promise<any[]> {
    return Array.from(this.masterCodes.values());
  }

  async addMasterCode(data: {property: string; masterCode: string; notes?: string;}): Promise<any> {
    const id = randomUUID();
    const masterCode = {
      id,
      ...data,
      createdAt: new Date(),
    };
    this.masterCodes.set(id, masterCode);
    return masterCode;
  }



  async updatePropertyFrontDoorCode(propertyId: string, code: string, expiry?: Date): Promise<Property | undefined> {
    const property = this.properties.get(propertyId);
    if (!property) return undefined;

    const updatedProperty = { 
      ...property, 
      frontDoorCode: code,
      codeExpiry: expiry || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days default
    };
    this.properties.set(propertyId, updatedProperty);
    return updatedProperty;
  }

  // Cash Turn-In tracking
  private cashTurnIns: Map<string, any> = new Map();

  // Admin Cash Drawer tracking
  private adminCashDrawer: Map<string, any> = new Map();

  // HouseBank tracking
  private houseBankTransactions: Map<string, any> = new Map();

  async getCashTurnIns(): Promise<any[]> {
    return Array.from(this.cashTurnIns.values());
  }

  async getCashTurnInsByManager(managerId: string): Promise<any[]> {
    return Array.from(this.cashTurnIns.values()).filter(turnIn => turnIn.managerId === managerId);
  }

  async createCashTurnIn(data: {
    managerId: string;
    managerName: string;
    property: string;
    amount: number;
    notes?: string;
    receivedBy?: string;
  }): Promise<any> {
    const id = randomUUID();
    const turnIn = {
      id,
      ...data,
      turnInDate: new Date(),
      createdAt: new Date(),
    };
    this.cashTurnIns.set(id, turnIn);

    // When manager turns in cash, add it to admin's cash drawer
    if (data.receivedBy) {
      await this.createAdminDrawerTransaction({
        type: 'cash_received',
        amount: data.amount,
        source: data.managerName,
        description: `Cash received from ${data.managerName} (${data.property})`,
        createdBy: data.receivedBy
      });
    }

    return turnIn;
  }

  // Admin Cash Drawer methods
  async getAdminDrawerTransactions(): Promise<any[]> {
    return Array.from(this.adminCashDrawer.values());
  }

  async createAdminDrawerTransaction(data: {
    type: 'cash_received' | 'cashapp_received' | 'bank_deposit_cash' | 'bank_deposit_cashapp' | 'house_bank_transfer';
    amount: number;
    source?: string;
    description: string;
    createdBy: string;
  }): Promise<any> {
    const id = randomUUID();
    const transaction = {
      id,
      ...data,
      transactionDate: new Date(),
      createdAt: new Date(),
    };
    this.adminCashDrawer.set(id, transaction);
    return transaction;
  }

  // HouseBank methods
  async getHouseBankTransactions(): Promise<any[]> {
    return Array.from(this.houseBankTransactions.values());
  }

  async createHouseBankTransaction(data: {
    type: 'transfer_in' | 'expense_supplies' | 'expense_contractor' | 'expense_maintenance' | 'expense_utilities' | 'expense_other';
    amount: number;
    category: 'supplies' | 'contractors' | 'maintenance' | 'utilities' | 'other';
    vendor?: string;
    description: string;
    receiptUrl?: string;
    createdBy: string;
  }): Promise<any> {
    const id = randomUUID();
    const transaction = {
      id,
      ...data,
      transactionDate: new Date(),
      createdAt: new Date(),
    };
    this.houseBankTransactions.set(id, transaction);
    return transaction;
  }

  async getHouseBankStats(): Promise<any> {
    const transactions = Array.from(this.houseBankTransactions.values());

    const transfersIn = transactions
      .filter(t => t.type === 'transfer_in')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter(t => t.type.startsWith('expense_'))
      .reduce((sum, t) => sum + t.amount, 0);

    const expensesByCategory = {
      supplies: transactions
        .filter(t => t.category === 'supplies')
        .reduce((sum, t) => sum + t.amount, 0),
      contractors: transactions
        .filter(t => t.category === 'contractors')
        .reduce((sum, t) => sum + t.amount, 0),
      maintenance: transactions
        .filter(t => t.category === 'contractors')
        .reduce((sum, t) => sum + t.amount, 0),
      maintenance: transactions
        .filter(t => t.category === 'maintenance')
        .reduce((sum, t) => sum + t.amount, 0),
      utilities: transactions
        .filter(t => t.category === 'utilities')
        .reduce((sum, t) => sum + t.amount, 0),
      other: transactions
        .filter(t => t.category === 'other')
        .reduce((sum, t) => sum + t.amount, 0),
    };

    const recentTransactions = transactions
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
      .slice(0, 10);

    return {
      currentBalance: Math.max(0, transfersIn - expenses),
      totalTransfersIn: transfersIn,
      totalExpenses: expenses,
      expensesByCategory,
      recentTransactions
    };
  }

  async getAdminDrawerStats(): Promise<any> {
    const transactions = Array.from(this.adminCashDrawer.values());
    const cashAppPayments = Array.from(this.payments.values()).filter(p => p.method === 'cash_app');

    // Calculate cash holdings
    const cashReceived = transactions
      .filter(t => t => t.type === 'cash_received')
      .reduce((sum, t) => sum + t.amount, 0);

    const cashDeposited = transactions
      .filter(t => t.type === 'bank_deposit_cash')
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate Cash App holdings (from payments received)
    const cashAppReceived = cashAppPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    const cashAppDeposited = transactions
      .filter(t => t.type === 'bank_deposit_cashapp')
      .reduce((sum, t) => sum + t.amount, 0);

    // Get last deposits
    const cashDeposits = transactions
      .filter(t => t.type === 'bank_deposit_cash')
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());

    const cashAppDeposits = transactions
      .filter(t => t.type === 'bank_deposit_cashapp')
      .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime());

    return {
      currentCashHolding: Math.max(0, cashReceived - cashDeposited),
      currentCashAppHolding: Math.max(0, cashAppReceived - cashAppDeposited),
      totalCashReceived: cashReceived,
      totalCashAppReceived: cashAppReceived,
      totalCashDeposited: cashDeposited,
      totalCashAppDeposited: cashAppDeposited,
      lastCashDeposit: cashDeposits[0] ? {
        amount: cashDeposits[0].amount,
        date: cashDeposits[0].transactionDate
      } : null,
      lastCashAppDeposit: cashAppDeposits[0] ? {
        amount: cashAppDeposits[0].amount,
        date: cashAppDeposits[0].transactionDate
      } : null
    };
  }

  async getCashDrawerStats(): Promise<any[]> {
    const managers = Array.from(this.users.values()).filter(user => user.role === 'manager');
    const payments = Array.from(this.payments.values());
    const turnIns = Array.from(this.cashTurnIns.values());
    const today = new Date().toDateString();

    return managers.map(manager => {
      const managerPayments = payments.filter(p => 
        p.receivedBy === manager.id && 
        p.method === 'cash'
      );

      const todayPayments = managerPayments.filter(p => 
        new Date(p.dateReceived).toDateString() === today
      );

      const totalCashCollectedToday = todayPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

      const managerTurnIns = turnIns.filter(t => t.managerId === manager.id);
      const lastTurnIn = managerTurnIns.sort((a, b) => 
        new Date(b.turnInDate).getTime() - new Date(a.turnInDate).getTime()
      )[0];

      const todayTurnIns = managerTurnIns.filter(t => 
        new Date(t.turnInDate).toDateString() === today
      );
      const todayTurnInAmount = todayTurnIns.reduce((sum, t) => sum + t.amount, 0);

      const currentCashHolding = Math.max(0, totalCashCollectedToday - todayTurnInAmount);

      return {
        managerId: manager.id,
        managerName: manager.name,
        property: manager.property || 'N/A',
        currentCashHolding,
        lastTurnInDate: lastTurnIn ? lastTurnIn.turnInDate : null,
        lastTurnInAmount: lastTurnIn ? lastTurnIn.amount : null,
        totalCashCollectedToday,
        pendingTurnIn: currentCashHolding
      };
    });
  }

  // Audit Log methods
  async createAuditLog(data: { userId: string; action: string; details: string }) {
    const id = randomUUID();
    const auditLog = {
      id,
      ...data,
      timestamp: new Date(),
    };
    // In memory storage - in production this would go to database
    return auditLog;
  }

  async getBannedUsers() {
    return Array.from(this.bannedList.values());
  }

  async createBannedUser(data: { name: string; phone?: string; email?: string; reason: string; bannedBy: string }) {
    const id = randomUUID();
    const bannedUser = {
      id,
      ...data,
      bannedDate: new Date(),
    };
    this.bannedList.set(id, bannedUser);
    return bannedUser;
  }

  async deleteBannedUser(id: string) {
    return this.bannedList.delete(id);
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<boolean> {
    const user = this.users.get(id);
    if (!user) return false;

    user.password = hashedPassword;
    this.users.set(id, user);
    return true;
  }

  async updateUserPrivileges(id: string, updates: { role: string; property: string | null }): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { 
      ...user, 
      role: updates.role as 'admin' | 'manager' | 'helper',
      property: updates.property
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
}

export const storage = new MemStorage();