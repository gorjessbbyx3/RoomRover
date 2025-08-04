// --- BOOKING MANAGEMENT ---
export async function updateBooking(id, data) { /* TODO: Implement */ }
export async function cancelBooking(id, userId) { /* TODO: Implement */ }
export async function getBookingsForRoom(roomId, start, end) { /* TODO: Implement */ }
export async function recordExternalPayment({ bookingId, amount, method, reference }) { /* TODO: Implement */ }
export async function checkInGuest(bookingId, userId) { /* TODO: Implement */ }
export async function checkOutGuest(bookingId, userId) { /* TODO: Implement */ }
export async function addBookingNote(bookingId, userId, note) { /* TODO: Implement */ }
export async function getBookingNotes(bookingId) { /* TODO: Implement */ }
export async function getBookingAttachments(bookingId) { /* TODO: Implement */ }
export async function getBookingAuditTrail(bookingId) { /* TODO: Implement */ }

// --- TASK ASSIGNMENT ---
export async function assignHelperToTask(taskId, helperId, assignerId) { /* TODO: Implement */ }
export async function unassignHelperFromTask(taskId, helperId, assignerId) { /* TODO: Implement */ }
export async function addTaskComment(taskId, userId, comment) { /* TODO: Implement */ }
export async function getTaskComments(taskId) { /* TODO: Implement */ }
export async function getTaskAttachments(taskId) { /* TODO: Implement */ }
export async function getTaskAuditTrail(taskId) { /* TODO: Implement */ }

// --- PAYMENTS ---
export async function createPaymentDispute(paymentId, userId, reason) { /* TODO: Implement */ }

// --- ANALYTICS & EXPORT ---
export async function getAnalyticsWidgets(role, property) { /* TODO: Implement */ }

// --- USER & ROLE MANAGEMENT ---
export async function switchUserRole(userId, role, property) { /* TODO: Implement */ }
export async function updateUserProfile(userId, data) { /* TODO: Implement */ }
export async function getUserActivityLog(userId) { /* TODO: Implement */ }

// --- INVENTORY & MAINTENANCE ---
export async function createInventoryUsage(itemId, userId, amount, notes) { /* TODO: Implement */ }
export async function createInventoryRestockRequest(itemId, userId, amount, notes) { /* TODO: Implement */ }
export async function createMaintenanceSchedule(maintenanceId, userId, date, notes) { /* TODO: Implement */ }
export async function completeMaintenance(maintenanceId, userId, notes) { /* TODO: Implement */ }

// --- GENERAL ---
export async function uploadFile(/* file, meta */) { /* TODO: Implement */ }
export async function createNotification(/* userId, type, message, meta */) { /* TODO: Implement */ }

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';

// Ensure we have the DATABASE_URL
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Validate database URL format
if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  throw new Error("DATABASE_URL must be a valid PostgreSQL connection string");
}

console.log('Connecting to database:', databaseUrl.replace(/:([^:@]{1,}@)/, ':***@'));

// Enhanced connection configuration with error handling
const sql = postgres(databaseUrl, {
  max: 20, // Increased pool size
  idle_timeout: 30,
  connect_timeout: 20,
  ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
  onnotice: (notice) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('PostgreSQL Notice:', notice);
    }
  },
  onparameter: (key, value) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('PostgreSQL Parameter:', key, value);
    }
  },
  transform: {
    undefined: null,
  },
  debug: process.env.NODE_ENV === 'development',
});

// Test connection on startup
sql`SELECT 1`.then(() => {
  console.log('✅ Database connection established successfully');
}).catch((error) => {
  console.error('❌ Database connection failed:', error);
  process.exit(1);
});

export const db = drizzle(sql, { schema });

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing database connection...');
  await sql.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Closing database connection...');
  await sql.end();
  process.exit(0);
});
