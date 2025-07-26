
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from '../shared/schema';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

console.log('Connecting to database:', process.env.DATABASE_URL.replace(/:([^:@]{1,}@)/, ':***@'));

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });
