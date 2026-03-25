import express from 'express';
import { config } from 'dotenv';
config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Dynamically import and register routes
let initialized = false;
let initPromise: Promise<void> | null = null;

async function initialize() {
  if (initialized) return;
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    const { registerRoutes } = await import('../server/routes');
    await registerRoutes(app);
    
    // Seed database
    try {
      const { seedDatabase } = await import('../server/seed');
      const seedPromise = seedDatabase();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Seed timeout')), 10000)
      );
      await Promise.race([seedPromise, timeoutPromise]);
      console.log('✅ Database seeded');
    } catch (err: any) {
      console.error('⚠️ Seed skipped:', err?.message);
    }
    
    initialized = true;
  })();
  
  return initPromise;
}

// Vercel handler
export default async function handler(req: any, res: any) {
  await initialize();
  return app(req, res);
}
