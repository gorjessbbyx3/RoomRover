import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { validateEnvironment } from "./env-validation";

// Load environment variables
import { config } from 'dotenv';
config();

// Validate environment variables
validateEnvironment();

// Ensure environment variables are loaded
console.log('Environment DATABASE_URL:', process.env.DATABASE_URL?.replace(/:([^:@]{1,}@)/, ':***@') || 'Not set - using in-memory storage');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Seed database on startup
  try {
    console.log('Attempting to seed PostgreSQL database...');
    const { seedDatabase } = await import("./seed");
    
    // Add timeout to prevent hanging
    const seedPromise = seedDatabase();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database seeding timeout')), 15000)
    );
    
    await Promise.race([seedPromise, timeoutPromise]);
    console.log('✅ PostgreSQL database seeded successfully');
  } catch (error) {
    console.error('❌ Failed to seed PostgreSQL database:', error?.message || error);
    console.error('⚠️  Application may not function properly without seeded data');
    
    // Don't exit the process, but log the issue for monitoring
    if (process.env.NODE_ENV === 'production') {
      // In production, continue without seeding but alert monitoring
      console.error('PRODUCTION ALERT: Database seeding failed');
    }
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  
  // Ensure we're using port 5000 for the web server
  const webPort = 5000;
  server.listen(webPort, "0.0.0.0", () => {
    log(`✅ Server listening on 0.0.0.0:${webPort}`);
    console.log(`🌐 Application available at http://localhost:${webPort}`);
  });
})();