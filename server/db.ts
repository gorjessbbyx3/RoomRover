
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared/schema';

// Ensure we have the DATABASE_URL and it's pointing to the external database
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Verify we're not using localhost
if (databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1')) {
  throw new Error("DATABASE_URL is pointing to localhost. Please use the external database URL.");
}

console.log('Connecting to database:', databaseUrl.replace(/:([^:@]{1,}@)/, ':***@'));

const sql = neon(databaseUrl);
export const db = drizzle(sql, { schema });
