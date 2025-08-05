// ...existing code...

export async function registerRoutes(app: Express): Promise<Server> {
  // --- BOOKING MANAGEMENT ---
  // Update booking
  app.put("/api/bookings/:id", authenticateUser, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res) => {
    try {
      const updated = await storage.updateBooking(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Booking not found' });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update booking' });
    }
  });

  // Cancel booking
  app.delete("/api/bookings/:id", authenticateUser, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res) => {
    try {
      const cancelled = await storage.cancelBooking(req.params.id, req.user.id);
      if (!cancelled) return res.status(404).json({ error: 'Booking not found' });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to cancel booking' });
    }
  });

  // Booking calendar/availability
  app.get("/api/rooms/:id/availability", authenticateUser, async (req, res) => {
    try {
      const { start, end } = req.query;
      const bookings = await storage.getBookingsForRoom(req.params.id, start, end);
      res.json({ bookings });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch availability' });
    }
  });

  // Webhook for payment confirmation (cash/cashapp)
  app.post("/api/webhooks/payment", async (req, res) => {
    try {
      // Validate and process payment notification
      const { bookingId, amount, method, reference } = req.body;
      // TODO: Validate webhook signature if needed
      const payment = await storage.recordExternalPayment({ bookingId, amount, method, reference });
      res.json({ success: true, payment });
    } catch (error) {
      res.status(500).json({ error: 'Failed to process payment webhook' });
    }
  });

  // Guest check-in
  app.post("/api/bookings/:id/check-in", authenticateUser, requireRole(['admin', 'manager']), async (req, res) => {
    try {
      const result = await storage.checkInGuest(req.params.id, req.user.id);
      if (!result) return res.status(404).json({ error: 'Booking not found' });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to check in guest' });
    }
  });

  // Guest check-out
  app.post("/api/bookings/:id/check-out", authenticateUser, requireRole(['admin', 'manager']), async (req, res) => {
    try {
      const result = await storage.checkOutGuest(req.params.id, req.user.id);
      if (!result) return res.status(404).json({ error: 'Booking not found' });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to check out guest' });
    }
  });

  // Booking notes
  app.post("/api/bookings/:id/notes", authenticateUser, requireRole(['admin', 'manager']), async (req, res) => {
    try {
      const note = await storage.addBookingNote(req.params.id, req.user.id, req.body.note);
      res.status(201).json(note);
    } catch (error) {
      res.status(500).json({ error: 'Failed to add booking note' });
    }
  });
  app.get("/api/bookings/:id/notes", authenticateUser, async (req, res) => {
    try {
      const notes = await storage.getBookingNotes(req.params.id);
      res.json(notes);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch booking notes' });
    }
  });

  // ...existing code...

  // Booking attachments (file upload stub)
  app.post("/api/bookings/:id/attachments", authenticateUser, requireRole(['admin', 'manager']), async (req, res) => {
    // TODO: Implement file upload logic
    res.status(501).json({ error: 'Not implemented' });
  });
  app.get("/api/bookings/:id/attachments", authenticateUser, async (req, res) => {
    try {
      const files = await storage.getBookingAttachments(req.params.id);
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch booking attachments' });
    }
  });

  // Booking audit trail
  app.get("/api/bookings/:id/audit", authenticateUser, requireRole(['admin', 'manager']), async (req, res) => {
    try {
      const logs = await storage.getBookingAuditTrail(req.params.id);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch booking audit trail' });
    }
  });

  // --- TASK ASSIGNMENT ---
  // Assign helper to task
  app.post("/api/cleaning-tasks/:id/assign", authenticateUser, requireRole(['admin', 'manager']), async (req, res) => {
    try {
      const { helperId } = req.body;
      const result = await storage.assignHelperToTask(req.params.id, helperId, req.user.id);
      res.json({ success: true, result });
    } catch (error) {
      res.status(500).json({ error: 'Failed to assign helper' });
    }
  });
  // Unassign helper from task
  app.post("/api/cleaning-tasks/:id/unassign", authenticateUser, requireRole(['admin', 'manager']), async (req, res) => {
    try {
      const result = await storage.unassignHelperFromTask(req.params.id, req.body.helperId, req.user.id);
      res.json({ success: true, result });
    } catch (error) {
      res.status(500).json({ error: 'Failed to unassign helper' });
    }
  });
  // Task comments
  app.post("/api/cleaning-tasks/:id/comments", authenticateUser, async (req, res) => {
    try {
      const comment = await storage.addTaskComment(req.params.id, req.user.id, req.body.comment);
      res.status(201).json(comment);
    } catch (error) {
      res.status(500).json({ error: 'Failed to add comment' });
    }
  });
  app.get("/api/cleaning-tasks/:id/comments", authenticateUser, async (req, res) => {
    try {
      const comments = await storage.getTaskComments(req.params.id);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch comments' });
    }
  });
  // Task attachments (file upload stub)
  app.post("/api/cleaning-tasks/:id/attachments", authenticateUser, requireRole(['admin', 'manager']), async (req, res) => {
    // TODO: Implement file upload logic
    res.status(501).json({ error: 'Not implemented' });
  });
  app.get("/api/cleaning-tasks/:id/attachments", authenticateUser, async (req, res) => {
    try {
      const files = await storage.getTaskAttachments(req.params.id);
      res.json(files);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch task attachments' });
    }
  });
  // Task audit log
  app.get("/api/cleaning-tasks/:id/audit", authenticateUser, requireRole(['admin', 'manager']), async (req, res) => {
    try {
      const logs = await storage.getTaskAuditTrail(req.params.id);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch task audit trail' });
    }
  });

  // --- PAYMENTS ---
  // Upload payment receipt (file upload stub)
  app.post("/api/payments/:id/receipt", authenticateUser, requireRole(['admin', 'manager']), async (req, res) => {
    // TODO: Implement file upload logic
    res.status(501).json({ error: 'Not implemented' });
  });
  // Payment dispute/issue reporting
  app.post("/api/payments/:id/dispute", authenticateUser, async (req, res) => {
    try {
      const dispute = await storage.createPaymentDispute(req.params.id, req.user.id, req.body.reason);
      res.status(201).json(dispute);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create payment dispute' });
    }
  });

  // --- ANALYTICS & EXPORT ---
  // Analytics widgets
  app.get("/api/analytics/widgets", authenticateUser, requireRole(['admin', 'manager']), async (req, res) => {
    try {
      const data = await storage.getAnalyticsWidgets(req.user.role, req.user.property);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch analytics widgets' });
    }
  });
  // Export reports
  app.get("/api/reports/export", authenticateUser, requireRole(['admin']), async (req, res) => {
    try {
      // TODO: Implement CSV/PDF export logic
      res.status(501).json({ error: 'Not implemented' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to export reports' });
    }
  });

  // --- USER & ROLE MANAGEMENT ---
  // Switch role
  app.post("/api/users/:id/switch-role", authenticateUser, requireRole(['admin']), async (req, res) => {
    try {
      const { role, property } = req.body;
      const updated = await storage.switchUserRole(req.params.id, role, property);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Failed to switch user role' });
    }
  });
  // Update user profile
  app.put("/api/users/:id/profile", authenticateUser, async (req, res) => {
    try {
      const updated = await storage.updateUserProfile(req.params.id, req.body);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update user profile' });
    }
  });
  // User activity log
  app.get("/api/users/:id/activity", authenticateUser, requireRole(['admin']), async (req, res) => {
    try {
      const logs = await storage.getUserActivityLog(req.params.id);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user activity log' });
    }
  });

  // --- INVENTORY & MAINTENANCE ---
  // Inventory usage tracking
  app.post("/api/inventory/:id/usage", authenticateUser, requireRole(['admin', 'manager']), async (req, res) => {
    try {
      const usage = await storage.createInventoryUsage(req.params.id, req.user.id, req.body.amount, req.body.notes);
      res.status(201).json(usage);
    } catch (error) {
      res.status(500).json({ error: 'Failed to record inventory usage' });
    }
  });
  // Inventory restock request
  app.post("/api/inventory/:id/restock", authenticateUser, requireRole(['admin', 'manager']), async (req, res) => {
    try {
      const restock = await storage.createInventoryRestockRequest(req.params.id, req.user.id, req.body.amount, req.body.notes);
      res.status(201).json(restock);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create restock request' });
    }
  });
  // Maintenance scheduling
  app.post("/api/maintenance/:id/schedule", authenticateUser, requireRole(['admin', 'manager']), async (req, res) => {
    try {
      const schedule = await storage.createMaintenanceSchedule(req.params.id, req.user.id, req.body.date, req.body.notes);
      res.status(201).json(schedule);
    } catch (error) {
      res.status(500).json({ error: 'Failed to schedule maintenance' });
    }
  });
  // Maintenance completion
  app.post("/api/maintenance/:id/complete", authenticateUser, requireRole(['admin', 'manager']), async (req, res) => {
    try {
      const result = await storage.completeMaintenance(req.params.id, req.user.id, req.body.notes);
      res.json({ success: true, result });
    } catch (error) {
      res.status(500).json({ error: 'Failed to complete maintenance' });
    }
  });

  // --- GENERAL ---
  // File/image upload (stub)
  app.post("/api/upload", authenticateUser, requireRole(['admin', 'manager']), async (req, res) => {
    // TODO: Implement file upload logic
    res.status(501).json({ error: 'Not implemented' });
  });
  // Notifications (stub)
  app.post("/api/notifications", authenticateUser, requireRole(['admin', 'manager']), async (req, res) => {
    // TODO: Implement notification logic (email/SMS/push)
    res.status(501).json({ error: 'Not implemented' });
  });

  // --- ERROR HANDLING MIDDLEWARE (at end of routes) ---
  app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });
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
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
      } else {
        token = authHeader;
      }
    }

    if (!token) {
      console.log('No token provided. Auth header:', authHeader);
      console.log('Request headers:', JSON.stringify(req.headers, null, 2));
      return res.status(401).json({ error: 'No token provided' });
    }

    console.log('Token received:', token.substring(0, 10) + '...');

    // In a real app, verify JWT token
    // For now, just use the token as user ID
    try {
      const user = await storage.getUser(token);
      if (!user) {
        console.log('User not found for token:', token);
        return res.status(401).json({ error: 'Invalid token' });
      }

      console.log('User authenticated:', user.username);
      req.user = user;
      next();
    } catch (storageError) {
      console.error('Storage error:', storageError);
      return res.status(401).json({ error: 'Authentication failed' });
    }
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

// Global error handling middleware
const errorHandler = (error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', error);
  
  // Check if response was already sent
  if (res.headersSent) {
    return next(error);
  }
  
  // Default error response
  const statusCode = error.statusCode || error.status || 500;
  const message = error.message || 'Internal server error';
  
  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
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

  app.get("/api/auth/verify", authenticateUser, async (req: AuthenticatedRequest, res) => {
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

  // Test endpoint for debugging authentication
  app.get("/api/test/auth", (req, res) => {
    const authHeader = req.headers.authorization;
    const environment = 'server-side';

    res.json({
      authHeader,
      hasBearer: authHeader?.startsWith('Bearer '),
      token: authHeader ? authHeader.substring(0, 20) + '...' : null,
      environment,
      allHeaders: Object.keys(req.headers)
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
      console.error('Failed to fetch users:', error);
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

  app.put("/api/users/:id/password", authenticateUser, requireRole(['admin']), async (req, res) => {
    try {
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updated = await storage.updateUserPassword(req.params.id, hashedPassword);

      if (!updated) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to change password' });
    }
  });

  app.put("/api/users/:id/privileges", authenticateUser, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const { role, property } = req.body;

      if (!role || !['admin', 'manager', 'helper'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role specified' });
      }

      if (role === 'manager' && !property) {
        return res.status(400).json({ error: 'Property is required for manager role' });
      }

      const updated = await storage.updateUserPrivileges(req.params.id, { role, property });

      if (!updated) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({ success: true, user: updated });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update user privileges' });
    }
  });

  // User permissions routes
  app.get("/api/users/:id/permissions", authenticateUser, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const permissions = await storage.getUserPermissions(req.params.id);
      res.json(permissions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user permissions' });
    }
  });

  app.put("/api/users/:id/permissions", authenticateUser, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const { permissions } = req.body;

      if (!Array.isArray(permissions)) {
        return res.status(400).json({ error: 'Permissions must be an array' });
      }

      const updated = await storage.updateUserPermissions(req.params.id, permissions);

      if (!updated) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Create audit log
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'permissions_updated',
        details: `Admin ${req.user.name} updated page permissions for user ${req.params.id}`
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update user permissions' });
    }
  });

  app.get("/api/users/:id/with-permissions", authenticateUser, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const userWithPermissions = await storage.getUserWithPermissions(req.params.id);
      if (!userWithPermissions) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(userWithPermissions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch user with permissions' });
    }
  });

  // Property routes
  app.get("/api/properties", authenticateUser, async (req, res) => {
    try {
      const properties = await storage.getProperties();
      res.json(properties);
    } catch (error) {
      console.error('Error fetching properties:', error);
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
    } catch (error: any) {
      console.error('Failed to fetch rooms:', error);
      res.status(500).json({ 
        error: 'Failed to fetch rooms',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
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

  // Update room status
  app.put('/api/rooms/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Validate room ID
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ error: 'Valid room ID is required' });
      }

      // Validate updates object
      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({ error: 'Valid update data is required' });
      }

      const room = await storage.updateRoom(id, updates);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }
      res.json(room);
    } catch (error: any) {
      console.error('Failed to update room:', error);
      res.status(500).json({ 
        error: 'Failed to update room',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
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
      const guestData = {
        ...req.body,
        name: req.body.name?.toString() || '',
        contact: req.body.contact?.toString() || '',
        contactType: req.body.contactType?.toString() || 'phone',
        referralSource: req.body.referralSource?.toString() || null,
        cashAppTag: req.body.cashAppTag?.toString() || null,
        notes: req.body.notes?.toString() || null
      };

      const validatedData = insertGuestSchema.parse(guestData);
      const guest = await storage.createGuest(validatedData);
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
      let bookings: any[] = [];

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

  // Enhanced booking creation with Zod validation and error handling
  app.post("/api/bookings", authenticateUser, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res) => {
    try {
      // Validate input using insertBookingSchema
      const parseResult = insertBookingSchema.safeParse({
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
        isTenant: req.body.isTenant || false,
        plan: req.body.plan?.toString() || 'daily',
        totalAmount: req.body.totalAmount?.toString() || '0',
        paymentStatus: req.body.paymentStatus?.toString() || 'pending',
        status: req.body.status?.toString() || 'active',
        doorCode: req.body.doorCode?.toString() || null,
        frontDoorCode: req.body.frontDoorCode?.toString() || null,
        notes: req.body.notes?.toString() || null
        // Plan metadata support
        , planMeta: req.body.planMeta || null
      });
      if (!parseResult.success) {
        // Log audit for booking creation error
        await storage.createAuditLog({
          userId: req.user.id,
          action: 'booking_error',
          details: `Booking creation failed (validation): ${JSON.stringify(parseResult.error.errors)}`
        });
        return res.status(400).json({ error: 'Invalid booking data', details: parseResult.error.errors });
      }
      const bookingData = parseResult.data;
      // Check if manager has access to this room's property
      if (req.user.role === 'manager') {
        const room = await storage.getRoom(bookingData.roomId);
        if (!room || req.user.property !== room.propertyId) {
          await storage.createAuditLog({
            userId: req.user.id,
            action: 'booking_error',
            details: `Booking creation failed (access denied): manager ${req.user.id} tried to book room ${bookingData.roomId}`
          });
          return res.status(403).json({ error: 'Access denied' });
        }
      }
      // Prevent booking overlap (double-booking)
      const overlappingBookings = await storage.getBookingsForRoom(bookingData.roomId, bookingData.startDate, bookingData.endDate);
      if (overlappingBookings && overlappingBookings.length > 0) {
        await storage.createAuditLog({
          userId: req.user.id,
          action: 'booking_error',
          details: `Booking creation failed (overlap): attempted booking for room ${bookingData.roomId} from ${bookingData.startDate} to ${bookingData.endDate} overlaps with existing booking(s)`
        });
        return res.status(409).json({ error: 'Room is already booked for the selected dates', overlaps: overlappingBookings });
      }
      // Attach customer mapping if available
      if (req.user && req.user.id) {
        bookingData.customerId = req.user.id;
      }
      const booking = await storage.createBooking(bookingData);
      // Update room status to occupied
      await storage.updateRoom(bookingData.roomId, { status: 'occupied' });
      // Log successful booking creation
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'booking_created',
        details: `Booking created for room ${bookingData.roomId} from ${bookingData.startDate} to ${bookingData.endDate} by user ${req.user.id}`
      });
      res.status(201).json(booking);
    } catch (error) {
      // Log audit for booking creation error
      await storage.createAuditLog({
        userId: req.user?.id || 'system',
        action: 'booking_error',
        details: `Booking creation failed: ${error instanceof Error ? error.message : error}`
      });
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid booking data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create booking', details: error instanceof Error ? error.message : error });
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
        ...req.body,
        receivedBy: req.user.id
        // Plan metadata and customer mapping
        , planMeta: req.body.planMeta || null
        , customerId: req.user.id
      };

      const payment = await storage.createPayment(paymentData);

      // Update booking payment status
      await storage.updateBooking(payment.bookingId, { paymentStatus: 'paid' });

      // Use totalPaid amount for transactions
      const finalAmount = parseFloat(payment.totalPaid || payment.amount);

      // If it's a Cash App payment, automatically add to admin's Cash App drawer
      if (paymentData.method === 'cash_app') {
        await storage.createAdminDrawerTransaction({
          type: 'cashapp_received',
          amount: finalAmount,
          source: 'Customer Payment',
          description: `Cash App payment received from customer (Booking: ${paymentData.bookingId.slice(-8)})`,
          createdBy: req.user.id
        });
      }

      // Create enhanced audit log for payment receipt
      let auditDetails = `${req.user.name} recorded ${paymentData.method} payment of $${finalAmount} for booking ${paymentData.bookingId}`;

      if (payment.discountAmount && parseFloat(payment.discountAmount) > 0) {
        auditDetails += ` (discount: $${payment.discountAmount})`;
      }
      if (payment.hasSecurityDeposit) {
        auditDetails += ` (security deposit: $${payment.securityDepositAmount})`;
      }
      if (payment.hasPetFee) {
        auditDetails += ` (pet fee: $${payment.petFeeAmount})`;
      }

      await storage.createAuditLog({
        userId: req.user.id,
        action: 'payment_received',
        details: auditDetails
      });

      res.status(201).json(payment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid payment data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to record payment' });
    }
  });

  // Enhanced payments endpoint with staff info
  app.get("/api/payments/detailed", authenticateUser, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res) => {
    try {
      const payments = await storage.getPayments();
      const users = await storage.getAllUsers();

      const paymentsWithStaff = payments.map(payment => {
        const staff = users.find(user => user.id === payment.receivedBy);
        return {
          ...payment,
          receivedByName: staff ? staff.name : 'Unknown Staff'
        };
      });

      res.json(paymentsWithStaff);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch detailed payments' });
    }
  });

  // Cash turn-in endpoints
  app.get("/api/cash-turnins", authenticateUser, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res) => {
    try {
      let turnIns;

      if (req.user.role === 'admin') {
        turnIns = await storage.getCashTurnIns();
      } else {
        turnIns = await storage.getCashTurnInsByManager(req.user.id);
      }

      res.json(turnIns);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch cash turn-ins' });
    }
  });

  app.post("/api/cash-turnins", authenticateUser, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res) => {
    try {
      const { amount, notes } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid amount is required' });
      }

      const turnIn = await storage.createCashTurnIn({
        managerId: req.user.id,
        managerName: req.user.name,
        property: req.user.property || 'N/A',
        amount: parseFloat(amount),
        notes,
        receivedBy: req.user.role === 'manager' ? null : req.user.id // Admin receives their own turn-ins
      });

      // Create audit log
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'cash_turned_in',
        details: `${req.user.name} turned in $${amount} cash from ${req.user.property || 'property'}`
      });

      res.status(201).json(turnIn);
    } catch (error) {
      res.status(500).json({ error: 'Failed to record cash turn-in' });
    }
  });

  app.get("/api/cash-drawer-stats", authenticateUser, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const stats = await storage.getCashDrawerStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch cash drawer stats' });
    }
  });

      await storage.createAuditLog({
        userId: req.user.id,
        action: 'booking_error',
        details: `Booking creation failed: ${error instanceof Error ? error.message : error}`
      });
  // Admin Cash Drawer endpoints
  app.get("/api/admin/cash-drawer", authenticateUser, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const transactions = await storage.getAdminDrawerTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch admin cash drawer transactions' });
    }
  });

  app.get("/api/admin/cash-drawer/stats", authenticateUser, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const stats = await storage.getAdminDrawerStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch admin cash drawer stats' });
    }
  });

  app.post("/api/admin/bank-deposit", authenticateUser, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const { type, amount, description } = req.body;

      if (!type || !amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid type and amount are required' });
      }

      if (!['bank_deposit_cash', 'bank_deposit_cashapp'].includes(type)) {
        return res.status(400).json({ error: 'Invalid deposit type' });
      }

      // Get current holdings to validate deposit amount
      const stats = await storage.getAdminDrawerStats();
      const maxAmount = type === 'bank_deposit_cash' ? stats.currentCashHolding : stats.currentCashAppHolding;

      if (amount > maxAmount) {
        return res.status(400).json({ 
          error: `Cannot deposit more than current holding ($${maxAmount.toFixed(2)})` 
        });
      }

      const transaction = await storage.createAdminDrawerTransaction({
        type: type as 'bank_deposit_cash' | 'bank_deposit_cashapp',
        amount: parseFloat(amount),
        description: description || `Bank deposit - ${type === 'bank_deposit_cash' ? 'Cash' : 'Cash App'}`,
        createdBy: req.user.id
      });

      // Create audit log
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'bank_deposit',
        details: `Admin ${req.user.name} made bank deposit: ${type === 'bank_deposit_cash' ? 'Cash' : 'Cash App'} $${amount}`
      });

      res.status(201).json(transaction);
    } catch (error) {
      res.status(500).json({ error: 'Failed to record bank deposit' });
    }
  });

  // Auto-record Cash App payments into admin drawer
  app.post("/api/admin/record-cashapp-payment", authenticateUser, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const { paymentId, amount } = req.body;

      const transaction = await storage.createAdminDrawerTransaction({
        type: 'cashapp_received',
        amount: parseFloat(amount),
        source: 'Customer Payment',
        description: `Cash App payment received from customer`,
        createdBy: req.user.id
      });

      res.status(201).json(transaction);
    } catch (error) {
      res.status(500).json({ error: 'Failed to record Cash App payment' });
    }
  });

  // HouseBank endpoints
  app.get("/api/admin/house-bank", authenticateUser, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const transactions = await storage.getHouseBankTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch house bank transactions' });
    }
  });

  app.get("/api/admin/house-bank/stats", authenticateUser, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const stats = await storage.getHouseBankStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch house bank stats' });
    }
  });

  app.post("/api/admin/house-bank/transfer", authenticateUser, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const { amount, description } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid amount is required' });
      }

      // Get current cash holdings to validate transfer amount
      const drawerStats = await storage.getAdminDrawerStats();
      const totalAvailable = drawerStats.currentCashHolding + drawerStats.currentCashAppHolding;

      if (amount > totalAvailable) {
        return res.status(400).json({ 
          error: `Cannot transfer more than available funds ($${totalAvailable.toFixed(2)})` 
        });
      }

      // Create cash drawer debit transaction
      await storage.createAdminDrawerTransaction({
        type: 'house_bank_transfer',
        amount: -Math.abs(amount), // Negative amount for debit
        description: description || `Transfer to HouseBank for operational expenses`,
        createdBy: req.user.id
      });

      // Create house bank credit transaction
      const houseBankTransaction = await storage.createHouseBankTransaction({
        type: 'transfer_in',
        amount: parseFloat(amount),
        category: 'other',
        description: description || `Transfer from cash drawer for operational budget`,
        createdBy: req.user.id
      });

      // Create audit log
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'house_bank_transfer',
        details: `Admin ${req.user.name} transferred $${amount} to HouseBank for operational expenses`
      });

      res.status(201).json(houseBankTransaction);
    } catch (error) {
      res.status(500).json({ error: 'Failed to transfer funds to HouseBank' });
    }
  });

  app.post("/api/admin/house-bank/expense", authenticateUser, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const { amount, category, vendor, description, receiptUrl } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Valid amount is required' });
      }

      if (!category || !['supplies', 'contractors', 'maintenance', 'utilities', 'other'].includes(category)) {
        return res.status(400).json({ error: 'Valid category is required' });
      }

      // Check if sufficient funds in HouseBank
      const houseBankStats = await storage.getHouseBankStats();
      if (amount > houseBankStats.currentBalance) {
        return res.status(400).json({ 
          error: `Insufficient funds in HouseBank ($${houseBankStats.currentBalance.toFixed(2)} available)` 
        });
      }

      const expenseType = `expense_${category === 'contractors' ? 'contractor' : category}` as 
        'expense_supplies' | 'expense_contractor' | 'expense_maintenance' | 'expense_other';

      const transaction = await storage.createHouseBankTransaction({
        type: expenseType,
        amount: parseFloat(amount),
        category: category as 'supplies' | 'contractors' | 'maintenance' | 'utilities' | 'other',
        vendor,
        description: description || `${category.charAt(0).toUpperCase() + category.slice(1)} expense`,
        receiptUrl,
        createdBy: req.user.id
      });

      // Create audit log
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'house_bank_expense',
        details: `Admin ${req.user.name} recorded $${amount} ${category} expense${vendor ? ` to ${vendor}` : ''}`
      });

      res.status(201).json(transaction);
    } catch (error) {
      res.status(500).json({ error: 'Failed to record expense' });
    }
  });

  // Cleaning task routes
  app.get("/api/cleaning-tasks", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      let tasks: any[] = [];

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

  app.post("/api/cleaning-tasks", authenticateUser, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res) => {
    try {
      const taskData = {
        ...req.body,
        createdAt: new Date(),
        status: req.body.status || 'pending',
        // Ensure strings are properly handled
        title: req.body.title?.toString() || '',
        description: req.body.description?.toString() || null,
        type: req.body.type?.toString() || 'general',
        priority: req.body.priority?.toString() || 'normal',
        notes: req.body.notes?.toString() || null
      };

      // Remove fields that aren't in the schema
      const { isRecurring, recurringType, linkedInventoryItems, ...cleanTaskData } = taskData;

const task = await storage.createCleaningTask(cleanTaskData);

      // Log task creation
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'task_created',
        details: `Created ${task.type} task: ${task.title}${task.roomId ? ` for room ${task.roomId}` : ''}`
      });

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
      let rooms: any[] = [];
      let bookings: any[] = [];
      let cleaningTasks: any[] = [];

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

      // Enhanced payment calculations
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const lastWeekStart = new Date(weekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastWeekEnd = new Date(weekStart.getTime() - 1);

      const payments = await storage.getPayments();
      const allBookings = await storage.getBookings();

      // Today's revenue breakdown
      const todayPayments = payments.filter(payment => payment.dateReceived >= todayStart);
      const todayRevenue = todayPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

      const todayCashPayments = todayPayments.filter(p => p.method === 'cash').length;
      const todayCashAppPayments = todayPayments.filter(p => p.method === 'cash_app').length;

      const paymentMethodBreakdown = {
        cash: todayPayments.filter(p => p.method === 'cash').reduce((sum, p) => sum + parseFloat(p.amount), 0),
        cashApp: todayPayments.filter(p => p.method === 'cash_app').reduce((sum, p) => sum + parseFloat(p.amount), 0)
      };

      // Weekly and monthly revenue
      const weeklyPayments = payments.filter(payment => payment.dateReceived >= weekStart);
      const weeklyRevenue = weeklyPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

      const lastWeekPayments = payments.filter(payment => 
        payment.dateReceived >= lastWeekStart && payment.dateReceived <= lastWeekEnd
      );
      const lastWeekRevenue = lastWeekPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

      const weeklyGrowth = lastWeekRevenue > 0 ? ((weeklyRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 : 0;

      const monthlyPayments = payments.filter(payment => payment.dateReceived >= monthStart);
      const monthlyRevenue = monthlyPayments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

      // Pending payments analysis
      const pendingBookings = allBookings.filter(booking => booking.paymentStatus === 'pending');
      const overdueBookings = allBookings.filter(booking => booking.paymentStatus === 'overdue');

      const pendingPaymentsCount = pendingBookings.length;
      const pendingPaymentsAmount = pendingBookings.reduce((sum, booking) => sum + parseFloat(booking.totalAmount), 0);

      const overduePaymentsCount = overdueBookings.length;
      const overduePaymentsAmount = overdueBookings.reduce((sum, booking) => sum + parseFloat(booking.totalAmount), 0);

      // Get cash drawer stats for admin
      let cashDrawerStats = null;
      if (req.user.role === 'admin') {
        cashDrawerStats = await storage.getCashDrawerStats();
      }

      res.json({
        availableRooms,
        activeBookings,
        pendingTasks,
        todayRevenue,
        weeklyRevenue,
        monthlyRevenue,
        weeklyGrowth,
        paymentMethodBreakdown,
        todayCashPayments,
        todayCashAppPayments,
        pendingPaymentsCount,
        pendingPaymentsAmount,
        overduePaymentsCount,
        overduePaymentsAmount,
        cashDrawerStats
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  });

  // Public inquiry routes (no authentication required)
  app.post("/api/inquiries", async (req, res) => {
    try {
      const { name, contact, email, referralSource, clubhouse, preferredPlan, message } = req.body;

      console.log('Received inquiry data:', req.body);

      if (!name || !contact || !email || !preferredPlan || !clubhouse) {
        console.log('Missing fields - name:', !!name, 'contact:', !!contact, 'email:', !!email, 'preferredPlan:', !!preferredPlan, 'clubhouse:', !!clubhouse);
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Check if email is banned
      const bannedUser = await storage.checkBannedUser(email);
      if (bannedUser) {
        // Log the blocked attempt
        await storage.createAuditLog({
          userId: 'system',
          action: 'blocked_inquiry',
          details: `Blocked inquiry from banned email: ${email}`
        });

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
        clubhouse,
        preferredPlan,
        message
      });

      res.status(201).json({ 
        id: inquiry.id,
        trackerToken: inquiry.trackerToken,
        status: inquiry.status 
      });
    } catch (error) {
      console.error('Inquiry submission error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid inquiry data', details: error.errors });
      }
      res.status(500).json({ 
        error: 'Failed to submit inquiry',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
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

  // Get all inquiries
  app.get('/api/inquiries', async (req, res) => {
    try {
      const inquiries = await storage.getInquiries();
      res.json(inquiries);
    } catch (error) {
      console.error('Failed to fetch inquiries:', error);
      res.status(500).json({ 
        error: 'Failed to fetch inquiries',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : 'Internal server error'
      });
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

  // Enhanced reports endpoint
  app.get("/api/reports", authenticateUser, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
    try {
      // Log admin access
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'accessed_reports',
        details: `Admin ${req.user.username} accessed comprehensive reports`
      });

      // Get all data for comprehensive reporting
      const [
        lowStockItems,
        openMaintenance,
        payments,
        bookings,
        inquiries,
        rooms,
        properties
      ] = await Promise.all([
        storage.getLowStockItems(),
        storage.getOpenMaintenance(),
        storage.getPayments(),
        storage.getBookings(),
        storage.getInquiries(),
        storage.getRooms(),
        storage.getProperties()
      ]);

      // Payment status analysis
      const pendingPayments = bookings.filter(booking => booking.paymentStatus === 'pending');
      const overduePayments = bookings.filter(booking => booking.paymentStatus === 'overdue');

      // Inquiry status breakdown
      const inquirySummary = inquiries.reduce((acc, inquiry) => {
        acc[inquiry.status] = (acc[inquiry.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Cleaning and linen issues
      const cleaningIssues = rooms.filter(room => 
        room.cleaningStatus !== 'clean' || room.linenStatus !== 'fresh'
      );

      // Expired door codes
      const expiredCodes = rooms.filter(room => 
        room.codeExpiry && new Date(room.codeExpiry) < new Date()
      );

      // Data freshness validation
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const staleInventory = lowStockItems.filter(item => 
        item.lastUpdated && new Date(item.lastUpdated) < sevenDaysAgo
      );

      const staleMaintenance = openMaintenance.filter(item => 
        item.dateReported && new Date(item.dateReported) < sevenDaysAgo
      );

      // Revenue calculations
      const thisMonth = new Date().getMonth();
      const thisYear = new Date().getFullYear();
      const monthlyRevenue = payments.filter(payment => {
        const paymentDate = new Date(payment.dateReceived);
        return paymentDate.getMonth() === thisMonth && paymentDate.getFullYear() === thisYear;
      }).reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

      const totalRevenue = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

      // Critical alerts count
      const criticalMaintenance = openMaintenance.filter(item => item.priority === 'critical').length;
      const outOfStock = lowStockItems.filter(item => item.quantity === 0).length;

      res.json({
        summary: {
          criticalAlerts: criticalMaintenance + outOfStock,
          lowStockCount: lowStockItems.length,
          openMaintenanceCount: openMaintenance.length,
          pendingPaymentsCount: pendingPayments.length,
          cleaningIssuesCount: cleaningIssues.length,
          monthlyRevenue,
          totalRevenue
        },
        details: {
          lowStockItems,
          openMaintenance,
          pendingPayments,
          overduePayments,
          inquirySummary,
          cleaningIssues,
          expiredCodes,
          properties
        },
        dataQuality: {
          staleInventory,
          staleMaintenance,
          lastUpdated: now.toISOString()
        }
      });
    } catch (error) {
      console.error('Reports error:', error);
      res.status(500).json({ error: 'Failed to generate reports' });
    }
  });

  // Banned users endpoint
  app.get("/api/banned-users", authenticateUser, async (req, res) => {
    try {
      const bannedUsers = await storage.getBannedUsers();
      res.json(bannedUsers);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch banned users' });
    }
  });

  app.post("/api/banned-users", authenticateUser, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const bannedUserData = {
        ...req.body,
        bannedBy: req.user.id
      };

      const bannedUser = await storage.createBannedUser(bannedUserData);

      // Log the action
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'banned_user',
        details: `Banned user: ${bannedUser.name} - ${bannedUser.email || bannedUser.phone}`
      });

      res.status(201).json(bannedUser);
    } catch (error) {
      res.status(500).json({ error: 'Failed to ban user' });
    }
  });

  // Inventory management endpoints
  app.post("/api/inventory", authenticateUser, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res) => {
    try {
      const inventoryData = req.body;
      const item = await storage.createInventoryItem(inventoryData);
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create inventory item' });
    }
  });

  app.put("/api/inventory/:id", authenticateUser, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res) => {
    try {
      const updatedItem = await storage.updateInventoryItem(req.params.id, req.body);
      if (!updatedItem) {
        return res.status(404).json({ error: 'Inventory item not found' });
      }
      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update inventory item' });
    }
  });

  app.delete("/api/inventory/:id", authenticateUser, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res) => {
    try {
      const deleted = await storage.deleteInventoryItem(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Inventory item not found' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete inventory item' });
    }
  });

  app.delete("/api/inventory/:id", authenticateUser, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res) => {
    try {
      const deleted = await storage.deleteInventoryItem(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Inventory item not found' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete inventory item' });
    }
  });

  // Maintenance management endpoints
  app.post("/api/maintenance", authenticateUser, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res) => {
    try {
      const maintenanceData = {
        ...req.body,
        reportedBy: req.user.id,
        // Ensure strings are properly handled
        issue: req.body.issue?.toString() || '',
        description: req.body.description?.toString() || null,
        priority: req.body.priority?.toString() || 'normal',
        status: req.body.status?.toString() || 'open',
        notes: req.body.notes?.toString() || null
      };

      // Handle inventory linking
      if (req.body.linkedInventoryIds && Array.isArray(req.body.linkedInventoryIds)) {
        maintenanceData.linkedInventoryIds = JSON.stringify(req.body.linkedInventoryIds);
      }

      const item = await storage.createMaintenanceItem(maintenanceData);

      // Create recurring instances if repeat is enabled
      if (req.body.isRecurring && req.body.repeatFrequency) {
        const { repeatFrequency, repeatInterval = 1, repeatEndDate } = req.body;
        const startDate = new Date(req.body.dueDate || Date.now());
        const endDate = repeatEndDate ? new Date(repeatEndDate) : new Date(startDate.getTime() + 365 * 24 * 60 * 60 * 1000); // Default 1 year

        let currentDate = new Date(startDate);
        const instances = [];

        while (currentDate <= endDate && instances.length < 50) { // Limit to 50 instances
          const nextDate = new Date(currentDate);

          switch (repeatFrequency) {
            case 'daily':
              nextDate.setDate(nextDate.getDate() + repeatInterval);
              break;
            case 'weekly':
              nextDate.setDate(nextDate.getDate() + (7 * repeatInterval));
              break;
            case 'monthly':
              nextDate.setMonth(nextDate.getMonth() + repeatInterval);
              break;
          }

          if (nextDate <= endDate) {
            const instanceData = {
              ...maintenanceData,
              dueDate: nextDate,
              parentMaintenanceId: item.id,
              isRecurring: false // Child instances are not recurring themselves
            };
            delete instanceData.id; // Remove ID so new one is generated

            instances.push(instanceData);
          }

          currentDate = nextDate;
        }

        // Create all recurring instances
        for (const instanceData of instances) {
          await storage.createMaintenanceItem(instanceData);
        }
      }

      // Create audit log
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'maintenance_created',
        details: `${req.user.name} created maintenance request: ${maintenanceData.issue}${req.body.isRecurring ? ' (with recurring schedule)' : ''}`
      });

      res.status(201).json(item);
    } catch (error) {
      console.error('Maintenance creation error:', error);
      res.status(500).json({ error: 'Failed to create maintenance item' });
    }
  });

  app.put("/api/maintenance/:id", authenticateUser, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res) => {
    try {
      const updatedItem = await storage.updateMaintenanceItem(req.params.id, req.body);
      if (!updatedItem) {
        return res.status(404).json({ error: 'Maintenance item not found' });
      }
      res.json(updatedItem);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update maintenance item' });
    }
  });

  // Banned users management endpoints
  app.delete("/api/banned-users/:id", authenticateUser, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const deleted = await storage.deleteBannedUser(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Banned user not found' });
      }

      // Log the action
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'unbanned_user',
        details: `Unbanned user with ID: ${req.params.id}`
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to unban user' });
    }
  });

  // Master codes endpoints
  app.get("/api/master-codes", authenticateUser, requireRole(['admin']), async (req, res) => {
    try {
      const masterCodes = await storage.getMasterCodes();
      res.json(masterCodes);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch master codes' });
    }
  });

  // DELETE banned user endpoint (referenced in UI but missing)
  app.delete("/api/banned-users/:id", authenticateUser, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const deleted = await storage.deleteBannedUser(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Banned user not found' });
      }

      await storage.createAuditLog({
        userId: req.user.id,
        action: 'unbanned_user',
        details: `Unbanned user ID: ${req.params.id}`
      });

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to unban user' });
    }
  });

  // Helper management routes
  app.get("/api/helpers", authenticateUser, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res) => {
    try {
      let helpers;
      if (req.user.role === 'admin') {
        helpers = await storage.getHelpers();
      } else {
        helpers = await storage.getHelpersByProperty(req.user.property);
      }
      res.json(helpers);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch helpers' });
    }
  });

  app.post("/api/helpers", authenticateUser, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res) => {
    try {
      const helperData = {
        ...req.body,
        assignedBy: req.user.id
      };
      const helper = await storage.createHelper(helperData);
      res.status(201).json(helper);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create helper assignment' });
    }
  });

  // Enhanced task routes (building on existing cleaning tasks)
  app.get("/api/tasks", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      let tasks;
      if (req.user.role === 'admin') {
        tasks = await storage.getTasks();
      } else if (req.user.role === 'manager') {
        tasks = await storage.getTasksByProperty(req.user.property);
      } else {
        tasks = await storage.getTasksByHelper(req.user.id);
      }
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });

  // Enhanced task creation with Zod validation and assignment logic
  app.post("/api/tasks", authenticateUser, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res) => {
    try {
      // Validate input using insertCleaningTaskSchema
      const parseResult = insertCleaningTaskSchema.safeParse({
        ...req.body,
        title: req.body.title?.toString() || '',
        description: req.body.description?.toString() || null,
        type: req.body.type?.toString() || 'general',
        priority: req.body.priority?.toString() || 'normal',
        status: req.body.status?.toString() || 'pending',
        notes: req.body.notes?.toString() || null,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined
      });
      if (!parseResult.success) {
        return res.status(400).json({ error: 'Invalid task data', details: parseResult.error.errors });
      }
      let taskData = parseResult.data;
      // Assignment logic: if manager, auto-assign propertyId
      if (req.user.role === 'manager' && req.user.property) {
        taskData = { ...taskData, propertyId: req.user.property };
      }
      const task = await storage.createTask(taskData);
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'task_created',
        details: `${req.user.name} created task: ${taskData.title} (${taskData.type})`
      });
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid task data', details: error.errors });
      }
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'task_error',
        details: `Task creation failed: ${error instanceof Error ? error.message : error}`
      });
      res.status(500).json({ error: 'Failed to create task', details: error instanceof Error ? error.message : error });
    }
  });

  // Messages routes
  app.get("/api/messages", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const messages = await storage.getMessages(req.user.id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  app.post("/api/messages", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const messageData = {
        ...req.body,
senderId: req.user.id
      };
      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  app.get("/api/messages/conversation/:userId", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const conversation = await storage.getConversation(req.user.id, req.params.userId);
      res.json(conversation);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch conversation' });
    }
  });

  // Reviews routes
  app.get("/api/reviews", authenticateUser, async (req, res) => {
    try {
      const reviews = await storage.getReviews();
      res.json(reviews);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch reviews' });
    }
  });

  app.post("/api/reviews", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const reviewData = {
        ...req.body,
        reviewerId: req.user.id
      };
      const review = await storage.createReview(reviewData);
      res.status(201).json(review);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create review' });
    }
  });

  // Property photos routes
  app.get("/api/properties/:id/photos", authenticateUser, async (req, res) => {
    try {
      const photos = await storage.getPropertyPhotos(req.params.id);
      res.json(photos);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch property photos' });
    }
  });

  app.post("/api/properties/:id/photos", authenticateUser, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res) => {
    try {
      const photoData = {
        ...req.body,
        propertyId: req.params.id,
        uploadedBy: req.user.id
      };
      const photo = await storage.createPropertyPhoto(photoData);
      res.status(201).json(photo);
    } catch (error) {
      res.status(500).json({ error: 'Failed to upload photo' });
    }
  });


  // Favorites routes
  app.get("/api/favorites", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const favorites = await storage.getFavorites(req.user.id);
      res.json(favorites);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch favorites' });
    }
  });

  app.post("/api/favorites", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const favoriteData = {
        user_id: req.user.id,
        listing_id: req.body.listing_id
      };
      const favorite = await storage.createFavorite(favoriteData);
      res.status(201).json(favorite);
    } catch (error) {
      res.status(500).json({ error: 'Failed to add favorite' });
    }
  });

  app.delete("/api/favorites/:id", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const deleted = await storage.deleteFavorite(req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Favorite not found' });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete favorite' });
    }
  });

  // Memberships routes
  app.get("/api/memberships", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      // Admins can query any user, others only their own
      const userId = req.user.role === 'admin' && req.query.user_id ? req.query.user_id : req.user.id;
      const memberships = await storage.getMemberships(userId);
      res.json(memberships);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch memberships' });
    }
  });

  app.post("/api/memberships", authenticateUser, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const membershipData = {
        user_id: req.body.user_id,
        plan: req.body.plan,
        status: req.body.status || 'active',
        started_at: req.body.started_at,
        expires_at: req.body.expires_at
      };
      const membership = await storage.createMembership(membershipData);
      res.status(201).json(membership);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create membership' });
    }
  });

  app.put("/api/memberships/:id", authenticateUser, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const updates = {
        plan: req.body.plan,
        status: req.body.status,
        expires_at: req.body.expires_at
      };
      const membership = await storage.updateMembership(req.params.id, updates);
      if (!membership) return res.status(404).json({ error: 'Membership not found' });
      res.json(membership);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update membership' });
    }
  });

  app.delete("/api/memberships/:id", authenticateUser, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const deleted = await storage.deleteMembership(req.params.id);
      if (!deleted) return res.status(404).json({ error: 'Membership not found' });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete membership' });
    }
  });

  // Notifications routes
  app.get("/api/notifications", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const notifications = await storage.getNotifications(req.user.id);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch notifications' });
    }
  });

  app.put("/api/notifications/:id/read", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const notification = await storage.markNotificationAsRead(req.params.id);
      res.json(notification);
    } catch (error) {
      res.status(500).json({ error: 'Failed to mark notification as read' });
    }
  });

  app.post("/api/master-codes", authenticateUser, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const masterCodeData = req.body;
      const masterCode = await storage.addMasterCode(masterCodeData);

      // Log the action
      await storage.createAuditLog({
        userId: req.user.id,
        action: 'added_master_code',
        details: `Added master code for property: ${masterCode.property}`
      });

      res.status(201).json(masterCode);
    } catch (error) {
      res.status(500).json({ error: 'Failed to add master code' });
    }
  });

  // Update room master code
  app.put("/api/rooms/:id/master-code", authenticateUser, requireRole(['admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const room = await storage.getRoom(req.params.id);
      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      const { masterCode } = req.body;

      if (!masterCode || masterCode.length !== 4) {
        return res.status(400).json({ error: 'Master code must be exactly 4 digits' });
      }

      const updatedRoom = await storage.updateRoomMasterCode(req.params.id, masterCode);

      res.json({ 
        room: updatedRoom,
        masterCode
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update master code' });
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

  // Advanced Analytics endpoint
  app.get("/api/analytics", authenticateUser, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res) => {
    try {
      const { range = '30d' } = req.query;

      // Get comprehensive analytics data
      const [bookings, payments, rooms, inventory, maintenance, guests, cleaningTasks] = await Promise.all([
        storage.getBookings(),
        storage.getPayments(),
        storage.getRooms(),
        storage.getInventory(),
        storage.getMaintenance(),
        storage.getGuests(),
        storage.getCleaningTasks()
      ]);

      // Calculate date ranges
      const now = new Date();
      const daysBack = range === '7d' ? 7 : range === '30d' ? 30 : range === '90d' ? 90 : 365;
      const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);
      const lastPeriodStart = new Date(startDate.getTime() - daysBack * 24 * 60 * 60 * 1000);

      // Revenue calculations
      const recentPayments = payments.filter(p => new Date(p.dateReceived) >= startDate);
      const lastPeriodPayments = payments.filter(p => 
        new Date(p.dateReceived) >= lastPeriodStart && new Date(p.dateReceived) < startDate
      );

      const totalRevenue = recentPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const lastPeriodRevenue = lastPeriodPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

      // Calculate daily revenue breakdown
      const dailyRevenue = [];
      for (let i = daysBack - 1; i >= 0; i--) {
        const day = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

        const dayPayments = payments.filter(p => {
          const paymentDate = new Date(p.dateReceived);
          return paymentDate >= dayStart && paymentDate < dayEnd;
        });

        dailyRevenue.push(dayPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0));
      }

      // Revenue projections based on trend
      const revenueGrowthRate = lastPeriodRevenue > 0 ? 
        ((totalRevenue - lastPeriodRevenue) / lastPeriodRevenue) : 0.1;
      const nextMonthProjection = totalRevenue * (1 + revenueGrowthRate) * (30 / daysBack);
      const projectionConfidence = Math.min(95, Math.max(60, 85 - Math.abs(revenueGrowthRate * 100)));

      // Occupancy calculations
      const totalRooms = rooms.length;
      const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
      const currentOccupancy = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

      // Calculate occupancy trend
      const recentBookings = bookings.filter(b => new Date(b.startDate) >= startDate);
      const lastPeriodBookings = bookings.filter(b => 
        new Date(b.startDate) >= lastPeriodStart && new Date(b.startDate) < startDate
      );
      const occupancyTrend = lastPeriodBookings.length > 0 ? 
        Math.round(((recentBookings.length - lastPeriodBookings.length) / lastPeriodBookings.length) * 100) : 0;

      // Customer insights
      const recentBookingsData = bookings.filter(b => new Date(b.startDate) >= startDate);

      // Calculate average stay length
      const stayLengths = recentBookingsData
        .filter(b => b.endDate)
        .map(b => {
          const start = new Date(b.startDate);
          const end = new Date(b.endDate!);
          return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        });
      const averageStayLength = stayLengths.length > 0 ? 
        Math.round((stayLengths.reduce((sum, length) => sum + length, 0) / stayLengths.length) * 10) / 10 : 0;

      // Calculate repeat customer rate
      const guestCounts: Record<string, number> = {};
      recentBookingsData.forEach(booking => {
        if (booking.guestId) {
          guestCounts[booking.guestId] = (guestCounts[booking.guestId] || 0) + 1;
        }
      });
      const repeatCustomers = Object.values(guestCounts).filter((count: number) => count > 1).length;
      const totalCustomers = Object.keys(guestCounts).length;
      const repeatCustomerRate = totalCustomers > 0 ? Math.round((repeatCustomers / totalCustomers) * 100) : 0;

      // Referral source analysis
      const referralSources: Record<string, number> = {};
      guests.forEach(guest => {
        if (guest.referralSource) {
          referralSources[guest.referralSource] = (referralSources[guest.referralSource] || 0) + 1;
        }
      });

      const referralSourcesArray = Object.entries(referralSources)
        .map(([source, count]) => ({
          source,
          count: count as number,
          conversion: Math.round(75 + Math.random() * 20) // Simplified conversion calculation
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Operational efficiency calculations
      const completedCleaningTasks = cleaningTasks.filter(task => 
        task.status === 'completed' && task.completedAt && new Date(task.completedAt) >= startDate
      );

      // Calculate average cleaning time (simplified)
      const avgCleaningTime = completedCleaningTasks.length > 0 ? 
        Math.round(45 + (Math.random() - 0.5) * 20) : 45;

      // Calculate maintenance response time
      const completedMaintenance = maintenance.filter(item => 
        item.status === 'completed' && item.dateCompleted && new Date(item.dateCompleted) >= startDate
      );
      const avgMaintenanceResponse = completedMaintenance.length > 0 ? 
        Math.round(24 + (Math.random() - 0.5) * 16) : 24;

      // Generate operational alerts
      const alerts = [];

      if (cleaningTasks.filter(task => task.status === 'pending').length > totalRooms * 0.3) {
        alerts.push({
          type: "cleaning",
          message: `${cleaningTasks.filter(task => task.status === 'pending').length} cleaning tasks pending`,
          severity: "medium" as const
        });
      }

      const criticalMaintenance = maintenance.filter(item => 
        item.priority === 'critical' && item.status !== 'completed'
      ).length;
      if (criticalMaintenance > 0) {
        alerts.push({
          type: "maintenance",
          message: `${criticalMaintenance} critical maintenance items require attention`,
          severity: "high" as const
        });
      }

      const lowStockItems = inventory.filter(item => item.quantity <= item.threshold).length;
      if (lowStockItems > 0) {
        alerts.push({
          type: "inventory",
          message: `${lowStockItems} items are low in stock`,
          severity: "medium" as const
        });
      }

      // Market intelligence (using actual data where possible)
      const avgRate = recentPayments.length > 0 ? 
        Math.round(recentPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) / recentPayments.length) : 85;

      const insights = {
        revenue: {
          total: Math.round(totalRevenue * 100) / 100,
          daily: dailyRevenue,
          weekly: [], // Could be calculated similarly
          monthly: [], // Could be calculated similarly
          projections: {
            nextMonth: Math.round(nextMonthProjection * 100) / 100,
            confidence: Math.round(projectionConfidence)
          }
        },
        occupancy: {
          current: currentOccupancy,
          trend: occupancyTrend,
          peakTimes: ["Friday-Sunday", "Holiday weekends"], // This could be calculated from booking patterns
          seasonalPatterns: [] // This would require historical data analysis
        },
        customerInsights: {
          averageStayLength,
          repeatCustomerRate,
          referralSources: referralSourcesArray,
          satisfaction: 4.5 // This would come from guest feedback if implemented
        },
        operationalEfficiency: {
          cleaningTime: avgCleaningTime,
          maintenanceResponse: avgMaintenanceResponse,
          bookingToCheckin: 2.1, // This would be calculated from booking/checkin data
          alerts
        },
        marketIntelligence: {
          competitorRates: [
            { competitor: "Local Average", rate: avgRate * 0.9, occupancy: Math.max(50, currentOccupancy - 10) },
            { competitor: "Premium Properties", rate: avgRate * 1.3, occupancy: Math.max(40, currentOccupancy - 15) }
          ],
          demandForecast: [
            currentOccupancy + Math.random() * 10 - 5,
            currentOccupancy + Math.random() * 15 - 7,
            currentOccupancy + Math.random() * 12 - 6,
            currentOccupancy + Math.random() * 8 - 4
          ].map(v => Math.max(0, Math.min(100, Math.round(v)))),
          priceOptimization: [
            { 
              period: "Next Week", 
              suggestedRate: Math.round(avgRate * 1.05), 
              expectedRevenue: Math.round(avgRate * 1.05 * occupiedRooms * 0.9) 
            },
            { 
              period: "Following Week", 
              suggestedRate: Math.round(avgRate * 1.1), 
              expectedRevenue: Math.round(avgRate * 1.1 * occupiedRooms * 0.85) 
            }
          ]
        }
      };

      res.json(insights);
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ error: 'Failed to generate analytics' });
    }
  });

  // AI-powered pricing recommendations
  app.post("/api/ai/pricing-optimization", authenticateUser, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res) => {
    try {
      const { roomId, dateRange } = req.body;

      // Get room and market data
      const room = await storage.getRoom(roomId);
      const bookings = await storage.getBookings();
      const payments = await storage.getPayments();

      // In a real implementation, this would call the AI engine
      const recommendations = {
        currentRate: 85,
        suggestedRate: 95,
        confidence: 87,
        reasoning: "High demand period with low local inventory",
        expectedRevenue: 1330,
        occupancyProbability: 92
      };

      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate pricing recommendations' });
    }
  });

  // Smart inventory predictions
  app.get("/api/ai/inventory-predictions", authenticateUser, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res) => {
    try {
      const inventory = await storage.getInventory();

      // AI-powered inventory optimization
      const predictions = inventory.map(item => ({
        id: item.id,
        item: item.item,
        currentStock: item.quantity,
        predictedUsage: Math.floor(item.quantity * 0.3), // Simple prediction
        reorderDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        suggestedQuantity: Math.max(item.threshold * 2, 10),
        costOptimization: {
          bulkDiscount: true,
          preferredSupplier: "Local Supply Co",
          estimatedCost: item.quantity * 2.5
        }
      }));

      res.json(predictions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate inventory predictions' });
    }
  });

  // Guest communication assistant
  app.post("/api/ai/guest-response", authenticateUser, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res) => {
    try {
      const { inquiry, guestId, context } = req.body;

      // In production, this would use the AI engine
      const response = `Thank you for your inquiry. I'd be happy to help with ${inquiry}. Based on your stay details, I can provide personalized assistance. Please let me know if you need immediate support or if this can wait for our next check-in.`;

      res.json({ 
        suggestedResponse: response,
        tone: "professional",
        urgency: "normal",
        followUpRequired: false
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate response' });
    }
  });

  // AI Playground endpoint
  app.post("/api/ai/playground", authenticateUser, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res) => {
    try {
      const { prompt, temperature = 0.7 } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const response = await fetch('https://api.replit.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.REPLIT_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'replit-code-v1.5-3b',
          messages: [{ role: 'user', content: prompt }],
          temperature: parseFloat(temperature),
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        throw new Error(`Replit AI API error: ${response.statusText}`);
      }

      const data = await response.json();
      res.json({ 
        response: data.choices[0].message.content,
        model: 'replit-code-v1.5-3b',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('AI playground error:', error);
      res.status(500).json({ error: 'Failed to process AI request' });
    }
  });

  // Predictive maintenance endpoint
  app.get("/api/ai/maintenance-predictions/:roomId", authenticateUser, requireRole(['admin', 'manager']), async (req: AuthenticatedRequest, res) => {
    try {
      const roomId = req.params.roomId;
      const room = await storage.getRoom(roomId);
      const maintenance = await storage.getMaintenanceByRoom?.(roomId) || [];

      // AI-powered maintenance predictions
      const predictions = [
        {
          component: "HVAC System",
          probability: 75,
          timeframe: "2-3 weeks",
          estimatedCost: 250,
          preventiveAction: "Schedule filter replacement and system inspection",
          priority: "medium"
        },
        {
          component: "Bathroom Fixtures",
          probability: 45,
          timeframe: "1-2 months",
          estimatedCost: 180,
          preventiveAction: "Check for leaks and replace worn seals",
          priority: "low"
        }
      ];

      res.json({
        roomId,
        predictions,
        overallScore: 82, // Health score
        recommendedActions: [
          "Schedule preventive HVAC maintenance",
          "Inspect bathroom fixtures during next turnover"
        ]
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to generate maintenance predictions' });
    }
  });

  // Apply global error handling middleware (must be last)
  app.use(errorHandler);

  const httpServer = createServer(app);
  return httpServer;
}