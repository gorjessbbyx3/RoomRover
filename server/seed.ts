import { db } from './db';
import { users, properties, rooms, inventory } from '../shared/schema';
import * as bcrypt from 'bcrypt';

export async function seedDatabase() {
  console.log('🌱 Seeding database...');

  // Create default admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  await db.insert(users).values({
    username: "admin",
    password: adminPassword,
    role: "admin",
    property: null,
    name: "Admin User",
  }).onConflictDoNothing();

  // Create property managers
  const p1ManagerPassword = await bcrypt.hash("p1manager123", 10);
  await db.insert(users).values({
    username: "p1manager",
    password: p1ManagerPassword,
    role: "manager",
    property: "P1",
    name: "P1 Manager",
  }).onConflictDoNothing();

  const p2ManagerPassword = await bcrypt.hash("p2manager123", 10);
  await db.insert(users).values({
    username: "p2manager",
    password: p2ManagerPassword,
    role: "manager",
    property: "P2",
    name: "P2 Manager",
  }).onConflictDoNothing();

  // Create helper user
  const helperPassword = await bcrypt.hash("helper123", 10);
  await db.insert(users).values({
    username: "helper",
    password: helperPassword,
    role: "helper",
    property: null,
    name: "Cleaning Helper",
  }).onConflictDoNothing();

  // Create properties
  await db.insert(properties).values({
    id: "P1",
    name: "Premium Location",
    description: "8 Rooms • Premium location with higher rates",
    frontDoorCode: "1234",
    codeExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    rateDaily: "100.00",
    rateWeekly: "500.00",
    rateMonthly: "2000.00",
  }).onConflictDoNothing();

  await db.insert(properties).values({
    id: "P2",
    name: "Value Location",
    description: "10 Rooms • Value location with competitive rates",
    frontDoorCode: "5678",
    codeExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    rateDaily: "60.00",
    rateWeekly: "300.00",
    rateMonthly: "1200.00",
  }).onConflictDoNothing();

  // Create rooms for P1 (8 rooms)
  const p1Rooms = Array.from({ length: 8 }, (_, i) => ({
    id: `P1-R${i + 1}`,
    propertyId: "P1",
    roomNumber: i + 1,
    status: "available",
    doorCode: null,
    codeExpiry: null,
    masterCode: '1234',
    cleaningStatus: "clean",
    linenStatus: "fresh",
    lastCleaned: new Date(),
    lastLinenChange: new Date(),
    notes: null,
  }));

  // Create rooms for P2 (10 rooms)
  const p2Rooms = Array.from({ length: 10 }, (_, i) => ({
    id: `P2-R${i + 1}`,
    propertyId: "P2",
    roomNumber: i + 1,
    status: "available",
    doorCode: null,
    codeExpiry: null,
    masterCode: '1234',
    cleaningStatus: "clean",
    linenStatus: "fresh",
    lastCleaned: new Date(),
    lastLinenChange: new Date(),
    notes: null,
  }));

  await db.insert(rooms).values([...p1Rooms, ...p2Rooms]).onConflictDoNothing();

  // Add sample inventory items
  await db.insert(inventory).values([
    {
      propertyId: "P1",
      item: "Sheet Sets",
      quantity: 20,
      threshold: 10,
      unit: "sets",
      notes: null,
    },
    {
      propertyId: "P1",
      item: "Towels",
      quantity: 30,
      threshold: 15,
      unit: "pieces",
      notes: null,
    },
    {
      propertyId: "P2",
      item: "Sheet Sets",
      quantity: 25,
      threshold: 12,
      unit: "sets",
      notes: null,
    },
    {
      propertyId: "P2",
      item: "Towels",
      quantity: 35,
      threshold: 18,
      unit: "pieces",
      notes: null,
    },
  ]).onConflictDoNothing();

  console.log('✅ Database seeded successfully!');
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase().catch(console.error);
}