
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
