import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertGuestSchema, insertBookingSchema, insertPaymentSchema, insertCleaningTaskSchema, insertInquirySchema } from "@shared/schema";
import { z } from "zod";
import * as bcrypt from "bcrypt";
import { randomUUID } from "crypto";

interface AuthenticatedRequest extends Request {
  user?: any;
}

// Authentication middleware
const authenticateUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader) {
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.replace('Bearer ', '');
      } else {
        token = authHeader;
      }
    }

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // In a real app, verify JWT token
    // For now, just use the token as user ID
    const user = await storage.getUser(token);
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Role-based access control
const requireRole = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
};

export async function registerRoutes(app: Express): Promise<Server> {

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // In a real app, generate a proper JWT token
      const token = user.id;

      res.json({ 
        token, 
        user: { 
          id: user.id, 
          username: user.username, 
          role: user.role, 
          property: user.property,
          name: user.name 
        } 
      });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post("/api/auth/verify", authenticateUser, async (req: AuthenticatedRequest, res) => {
    res.json({ 
      user: { 
        id: req.user.id, 
        username: req.user.username, 
        role: req.user.role, 
        property: req.user.property,
        name: req.user.name 
      } 
    });
  });

  // User routes
  app.get("/api/users", authenticateUser, requireRole(['admin']), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const sanitizedUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        role: user.role,
        property: user.property,
        name: user.name,
        createdAt: user.createdAt
      }));
      res.json(sanitizedUsers);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.post("/api/users", authenticateUser, requireRole(['admin']), async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);

      res.status(201).json({
        id: user.id,
        username: user.username,
        role: user.role,
        property: user.property,
        name: user.name,
        createdAt: user.createdAt
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid user data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  // Property routes
  app.get("/api/properties", authenticateUser, async (req, res) => {
    try {
      const properties = await storage.getProperties();
      res.json(properties);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch properties' });
    }
  });

  app.get("/api/properties/:id", authenticateUser, async (req, res) => {
    try {
      const property = await storage.getProperty(req.params.id);
      if (!property) {
        return res.status(404).json({ error: 'Property not found' });
      }
      res.json(property);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch property' });
    }
  });

  // Room routes
  app.get("/api/rooms", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      let rooms;

      if (req.user.role === 'admin') {
        rooms = await storage.getRooms();
      } else if (req.user.role === 'manager' && req.user.property) {
        rooms = await storage.getRoomsByProperty(req.user.property);
      } else {
        rooms = await storage.getRooms(); // Helpers can see all rooms for cleaning
      }

      res.json(rooms);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch rooms' });
    }
  });

  app.get("/api/rooms/:id", authenticateUser, async (req, res) => {
    try {
      const room = await storage.getRoom(req.params.id);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }
      res.json(room);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch room' });
    }
  });

  app.put("/api/rooms/:id", authenticateUser, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res) => {
    try {
      const room = await storage.getRoom(req.params.id);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      // Check if manager has access to this room's property
      if (req.user.role === 'manager' && req.user.property !== room.propertyId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updatedRoom = await storage.updateRoom(req.params.id, req.body);
      res.json(updatedRoom);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update room' });
    }
  });

  // Generate door codes
  app.post("/api/rooms/:id/generate-code", authenticateUser, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res) => {
    try {
      const room = await storage.getRoom(req.params.id);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      // Check if manager has access to this room's property
      if (req.user.role === 'manager' && req.user.property !== room.propertyId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { duration = 'monthly' } = req.body;

      // Generate 4-digit code
      const doorCode = Math.floor(1000 + Math.random() * 9000).toString();

      // Set expiry based on duration
      const expiry = new Date();
      switch (duration) {
        case 'daily':
          expiry.setDate(expiry.getDate() + 2);
          break;
        case 'weekly':
          expiry.setDate(expiry.getDate() + 10);
          break;
        case 'monthly':
        default:
          expiry.setDate(expiry.getDate() + 35);
          break;
      }

      const updatedRoom = await storage.updateRoom(req.params.id, {
        doorCode,
        codeExpiry: expiry
      });

      res.json({ doorCode, codeExpiry: expiry, room: updatedRoom });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate door code' });
    }
  });

  // Guest routes
  app.get("/api/guests", authenticateUser, requireRole(['admin', 'manager']), async (req, res) => {
    try {
      const guests = await storage.getGuests();
      res.json(guests);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch guests' });
    }
  });

  app.post("/api/guests", authenticateUser, requireRole(['admin', 'manager']), async (req, res) => {
    try {
      const guestData = insertGuestSchema.parse(req.body);
      const guest = await storage.createGuest(guestData);
      res.status(201).json(guest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid guest data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create guest' });
    }
  });

  // Booking routes
  app.get("/api/bookings", authenticateUser, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res) => {
    try {
      let bookings;

      if (req.user.role === 'admin') {
        bookings = await storage.getBookings();
      } else if (req.user.role === 'manager' && req.user.property) {
        // Get bookings for rooms in manager's property
        const rooms = await storage.getRoomsByProperty(req.user.property);
        const roomIds = rooms.map(room => room.id);
        const allBookings = await storage.getBookings();
        bookings = allBookings.filter(booking => roomIds.includes(booking.roomId));
      } else {
        bookings = [];
      }

      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch bookings' });
    }
  });

  app.post("/api/bookings", authenticateUser, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res) => {
    try {
      const bookingData = insertBookingSchema.parse(req.body);

      // Validate that the booking is at least 30 days for compliance
      const startDate = new Date(bookingData.startDate);
      const endDate = new Date(bookingData.endDate);
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDiff < 30 && bookingData.plan !== 'monthly') {
        return res.status(400).json({ error: 'Bookings must be at least 30 days for compliance' });
      }

      // Check if manager has access to this room's property
      if (req.user.role === 'manager') {
        const room = await storage.getRoom(bookingData.roomId);
        if (!room || req.user.property !== room.propertyId) {
          return res.status(403).json({ error: 'Access denied' });
        }
      }

      const booking = await storage.createBooking(bookingData);

      // Update room status to occupied
      await storage.updateRoom(bookingData.roomId, { status: 'occupied' });

      res.status(201).json(booking);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid booking data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create booking' });
    }
  });

  // Payment routes
  app.get("/api/payments", authenticateUser, requireRole(['admin', 'manager']), async (req, res) => {
    try {
      const payments = await storage.getPayments();
      res.json(payments);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch payments' });
    }
  });

  app.post("/api/payments", authenticateUser, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res) => {
    try {
      const paymentData = {
        ...insertPaymentSchema.parse(req.body),
        receivedBy: req.user.id
      };

      const payment = await storage.createPayment(paymentData);

      // Update booking payment status
      await storage.updateBooking(payment.bookingId, { paymentStatus: 'paid' });

      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid payment data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to record payment' });
    }
  });

  // Cleaning task routes
  app.get("/api/cleaning-tasks", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      let tasks;

      if (req.user.role === 'admin') {
        tasks = await storage.getCleaningTasks();
      } else if (req.user.role === 'manager' && req.user.property) {
        tasks = await storage.getCleaningTasksByProperty(req.user.property);
      } else if (req.user.role === 'helper') {
        tasks = await storage.getCleaningTasksByAssignee(req.user.id);
      } else {
        tasks = [];
      }

      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch cleaning tasks' });
    }
  });

  app.post("/api/cleaning-tasks", authenticateUser, requireRole(['admin', 'manager']), async (req, res) => {
    try {
      const taskData = insertCleaningTaskSchema.parse(req.body);
      const task = await storage.createCleaningTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid task data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create cleaning task' });
    }
  });

  app.put("/api/cleaning-tasks/:id", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const task = await storage.getCleaningTask(req.params.id);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Check permissions
      if (req.user.role === 'manager' && req.user.property !== task.propertyId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      if (req.user.role === 'helper' && task.assignedTo !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updates = req.body;
      if (updates.status === 'completed') {
        updates.completedAt = new Date();
        updates.completedBy = req.user.id;

        // Update room status if it's a room cleaning task
        if (task.roomId && task.type === 'room_cleaning') {
          await storage.updateRoom(task.roomId, { 
            cleaningStatus: 'clean',
            linenStatus: 'fresh',
            lastCleaned: new Date(),
            lastLinenChange: new Date()
          });
        }
      }

      const updatedTask = await storage.updateCleaningTask(req.params.id, updates);
      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update cleaning task' });
    }
  });

  // Inventory routes
  app.get("/api/inventory", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      let inventory;

      if (req.user.role === 'admin') {
        inventory = await storage.getInventory();
      } else if (req.user.role === 'manager' && req.user.property) {
        inventory = await storage.getInventoryByProperty(req.user.property);
      } else {
        inventory = await storage.getInventory(); // Helpers can see all for cleaning supplies
      }

      res.json(inventory);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch inventory' });
    }
  });

  app.get("/api/inventory/low-stock", authenticateUser, requireRole(['admin']), async (req, res) => {
    try {
      const lowStockItems = await storage.getLowStockItems();
      res.json(lowStockItems);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch low stock items' });
    }
  });

  // Maintenance routes
  app.get("/api/maintenance", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      let maintenance;

      if (req.user.role === 'admin') {
        maintenance = await storage.getMaintenance();
      } else if (req.user.role === 'manager' && req.user.property) {
        maintenance = await storage.getMaintenanceByProperty(req.user.property);
      } else {
        maintenance = [];
      }

      res.json(maintenance);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch maintenance items' });
    }
  });

  app.get("/api/maintenance/open", authenticateUser, requireRole(['admin']), async (req, res) => {
    try {
      const openMaintenance = await storage.getOpenMaintenance();
      res.json(openMaintenance);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch open maintenance items' });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      let rooms, bookings, cleaningTasks;

      if (req.user.role === 'admin') {
        rooms = await storage.getRooms();
        bookings = await storage.getActiveBookings();
        cleaningTasks = await storage.getPendingCleaningTasks();
      } else if (req.user.role === 'manager' && req.user.property) {
        rooms = await storage.getRoomsByProperty(req.user.property);
        const allBookings = await storage.getActiveBookings();
        const roomIds = rooms.map(room => room.id);
        bookings = allBookings.filter(booking => roomIds.includes(booking.roomId));
        cleaningTasks = await storage.getCleaningTasksByProperty(req.user.property);
      } else {
        rooms = [];
        bookings = [];
        cleaningTasks = await storage.getCleaningTasksByAssignee(req.user.id);
      }

      const availableRooms = rooms.filter(room => room.status === 'available').length;
      const activeBookings = bookings.length;
      const pendingTasks = cleaningTasks.filter(task => task.status === 'pending').length;

      // Calculate revenue (simplified)
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const payments = await storage.getPayments();
      const todayRevenue = payments
        .filter(payment => payment.dateReceived >= todayStart)
        .reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

      res.json({
        availableRooms,
        activeBookings,
        pendingTasks,
        todayRevenue
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  });

  // Public inquiry routes (no authentication required)
  app.post("/api/inquiries", async (req, res) => {
    try {
      const { name, contact, email, referralSource, plan, message } = req.body;

      if (!name || !contact || !email || !plan) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check if email is banned
      const bannedUser = await storage.checkBannedUser(email);
      if (bannedUser) {
        return res.status(403).json({ 
          error: "Unable to process inquiry", 
          reason: "blocked" 
        });
      }

      const inquiry = await storage.createInquiry({
        name,
        contact,
        email,
        referralSource,
        plan,
        message
      });

      res.status(201).json({ 
        id: inquiry.id,
        trackerToken: inquiry.trackerToken,
        status: inquiry.status 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid inquiry data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to submit inquiry' });
    }
  });

  app.get("/api/inquiries/track/:token", async (req, res) => {
    try {
      const inquiry = await storage.getInquiryByToken(req.params.token);
      if (!inquiry) {
        return res.status(404).json({ error: 'Inquiry not found or expired' });
      }

      // Check if token is expired
      if (new Date() > inquiry.tokenExpiry) {
        return res.status(404).json({ error: 'Tracking link has expired' });
      }

      let booking = null;
      if (inquiry.bookingId) {
        booking = await storage.getBooking(inquiry.bookingId);
      }

      res.json({
        id: inquiry.id,
        status: inquiry.status,
        booking: booking ? {
          roomId: booking.roomId,
          doorCode: booking.doorCode,
          frontDoorCode: booking.frontDoorCode,
          startDate: booking.startDate,
          endDate: booking.endDate
        } : null
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch inquiry status' });
    }
  });

  // Admin routes for managing inquiries
  app.get("/api/inquiries", authenticateUser, requireRole(['admin', 'manager']), async (req, res) => {
    try {
      const inquiries = await storage.getInquiries();
      res.json(inquiries);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch inquiries' });
    }
  });

  app.put("/api/inquiries/:id", authenticateUser, requireRole(['admin', 'manager']), async (req, res) => {
    try {
      const updatedInquiry = await storage.updateInquiry(req.params.id, req.body);
      if (!updatedInquiry) {
        return res.status(404).json({ error: 'Inquiry not found' });
      }
      res.json(updatedInquiry);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update inquiry' });
    }
  });

  // Auto assign room to inquiry
  app.post("/api/inquiries/:id/assign-room", authenticateUser, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res) => {
    try {
      const inquiry = await storage.getInquiry(req.params.id);
      if (!inquiry) {
        return res.status(404).json({ error: 'Inquiry not found' });
      }

      const { propertyId, plan, startDate, endDate } = req.body;

      // Get available rooms for the property
      const rooms = await storage.getRoomsByProperty(propertyId);
      const availableRoom = rooms.find(room => room.status === 'available');

      if (!availableRoom) {
        return res.status(400).json({ error: 'No available rooms in selected property' });
      }

      // Create guest first
      const guest = await storage.createGuest({
        name: inquiry.name,
        contact: inquiry.contact,
        contactType: inquiry.contact.includes('@') ? 'email' : 'phone',
        referralSource: inquiry.referralSource || null,
        notes: inquiry.message || null
      });

      // Generate door codes
      const roomCode = Math.floor(1000 + Math.random() * 9000).toString();
      const codeExpiry = new Date();
      codeExpiry.setDate(codeExpiry.getDate() + 35); // 35 days

      // Get property for front door code
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ error: 'Property not found' });
      }

      // Calculate total amount based on plan
      const rates = {
        daily: parseFloat(property.rateDaily),
        weekly: parseFloat(property.rateWeekly),
        monthly: parseFloat(property.rateMonthly)
      };

      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

      let totalAmount = 0;
      if (plan === 'monthly') {
        totalAmount = rates.monthly;
      } else if (plan === 'weekly') {
        totalAmount = rates.weekly;
      } else {
        totalAmount = rates.daily * days;
      }

      // Create booking
      const booking = await storage.createBooking({
        roomId: availableRoom.id,
        guestId: guest.id,
        plan,
        startDate: start,
        endDate: end,
        totalAmount: totalAmount.toString(),
        doorCode: roomCode,
        frontDoorCode: property.frontDoorCode || null,
        codeExpiry,
        notes: null
      });

      // Update room to occupied and assign door code
      await storage.updateRoom(availableRoom.id, { 
        status: 'occupied',
        doorCode: roomCode,
        codeExpiry
      });

      // Update inquiry with booking
      await storage.updateInquiry(req.params.id, {
        status: 'booking_confirmed',
        bookingId: booking.id
      });

      res.json({
        booking,
        guest,
        room: availableRoom,
        inquiry: await storage.getInquiry(req.params.id)
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to assign room' });
    }
  });

  // Update front door code
  app.put("/api/properties/:id/front-door-code", authenticateUser, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res) => {
    try {
      const property = await storage.getProperty(req.params.id);
      if (!property) {
        return res.status(404).json({ error: 'Property not found' });
      }

      // Check if manager has access to this property
      if (req.user.role === 'manager' && req.user.property !== req.params.id) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const { frontDoorCode, duration = 'monthly' } = req.body;

      if (!frontDoorCode) {
        return res.status(400).json({ error: 'Front door code is required' });
      }

      // Set expiry based on duration
      const expiry = new Date();
      switch (duration) {
        case 'daily':
          expiry.setDate(expiry.getDate() + 2);
          break;
        case 'weekly':
          expiry.setDate(expiry.getDate() + 10);
          break;
        case 'monthly':
        default:
          expiry.setDate(expiry.getDate() + 35);
          break;
      }

      const updatedProperty = await storage.updatePropertyFrontDoorCode(req.params.id, frontDoorCode, expiry);

      res.json({ 
        property: updatedProperty,
        frontDoorCode,
        codeExpiry: expiry
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update front door code' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}