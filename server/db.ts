import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../shared/schema';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

if (!databaseUrl.startsWith('postgresql://') && !databaseUrl.startsWith('postgres://')) {
  throw new Error("DATABASE_URL must be a valid PostgreSQL connection string");
}

console.log('Connecting to database:', databaseUrl.replace(/:([^:@]{1,}@)/, ':***@'));

const sql = postgres(databaseUrl, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 15,
  ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
  transform: {
    undefined: null,
  },
});

sql`SELECT 1`.then(() => {
  console.log('✅ Database connection established successfully');
}).catch((error) => {
  console.error('❌ Database connection failed:', error.message);
});

export const db = drizzle(sql, { schema });
