
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// Rate limiting configurations
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many authentication attempts, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many API requests, please try again later.',
});

// CSRF Protection
export const csrfTokens = new Map<string, number>();

export function generateCSRFToken(): string {
  const token = crypto.randomBytes(32).toString('hex');
  csrfTokens.set(token, Date.now() + 3600000); // 1 hour expiry
  return token;
}

export function validateCSRFToken(token: string): boolean {
  const expiry = csrfTokens.get(token);
  if (!expiry || Date.now() > expiry) {
    csrfTokens.delete(token);
    return false;
  }
  return true;
}

// Advanced JWT implementation with rotation
export class TokenManager {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
  private static readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || crypto.randomBytes(64).toString('hex');
  private static readonly blacklistedTokens = new Set<string>();
  
  static generateTokenPair(userId: string, role: string) {
    const now = Math.floor(Date.now() / 1000);
    const accessToken = jwt.sign(
      { 
        userId, 
        role, 
        type: 'access',
        iat: now,
        jti: crypto.randomUUID()
      },
      this.JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    const refreshToken = jwt.sign(
      { 
        userId, 
        role, 
        type: 'refresh',
        iat: now,
        jti: crypto.randomUUID()
      },
      this.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    
    return { accessToken, refreshToken };
  }
  
  static verifyAccessToken(token: string) {
    if (this.blacklistedTokens.has(token)) {
      throw new Error('Token has been revoked');
    }
    return jwt.verify(token, this.JWT_SECRET);
  }
  
  static verifyRefreshToken(token: string) {
    if (this.blacklistedTokens.has(token)) {
      throw new Error('Token has been revoked');
    }
    return jwt.verify(token, this.JWT_REFRESH_SECRET);
  }

  static revokeToken(token: string) {
    this.blacklistedTokens.add(token);
  }
}

// Advanced audit logging with security focus
export class SecurityAuditLogger {
  static async logSecurityEvent(event: {
    userId?: string;
    action: string;
    resource: string;
    ip: string;
    userAgent: string;
    success: boolean;
    details?: any;
    severity?: 'low' | 'medium' | 'high' | 'critical';
  }) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      severity: event.severity || (event.success ? 'low' : 'medium'),
      ...event
    };

    console.log(`[SECURITY-${logEntry.severity.toUpperCase()}] ${event.action} on ${event.resource} by ${event.userId || 'anonymous'} from ${event.ip}: ${event.success ? 'SUCCESS' : 'FAILED'}`);
    
    // In production, send to security monitoring service
    if (process.env.SECURITY_WEBHOOK && logEntry.severity !== 'low') {
      try {
        await fetch(process.env.SECURITY_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(logEntry),
          signal: AbortSignal.timeout(5000)
        });
      } catch (error) {
        console.error('Failed to send security log:', error);
      }
    }
  }
}

// Input validation and sanitization
export function validateAndSanitize(schema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Sanitize common XSS vectors
      const sanitizeInput = (obj: any): any => {
        if (typeof obj === 'string') {
          return obj
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .substring(0, 10000); // Limit input length
        }
        if (typeof obj === 'object' && obj !== null) {
          const sanitized: any = Array.isArray(obj) ? [] : {};
          for (const key in obj) {
            sanitized[key] = sanitizeInput(obj[key]);
          }
          return sanitized;
        }
        return obj;
      };

      req.body = sanitizeInput(req.body);
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      SecurityAuditLogger.logSecurityEvent({
        action: 'input_validation_failed',
        resource: req.path,
        ip: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || 'unknown',
        success: false,
        details: error,
        severity: 'medium'
      });
      res.status(400).json({ error: 'Invalid input data', details: error });
    }
  };
}

// Content Security Policy with strict settings
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "wss:", "ws:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for Replit
  crossOriginResourcePolicy: { policy: "cross-origin" }
});

// Request sanitization middleware
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction) => {
  // Remove potentially dangerous headers
  delete req.headers['x-forwarded-host'];
  delete req.headers['x-real-ip'];
  
  // Limit request size
  if (req.headers['content-length'] && parseInt(req.headers['content-length']) > 10000000) {
    return res.status(413).json({ error: 'Request too large' });
  }
  
  next();
};

// Session management with secure defaults
export class SessionManager {
  private static sessions = new Map<string, { userId: string; expires: number; ip: string }>();
  
  static createSession(userId: string, ip: string): string {
    const sessionId = crypto.randomUUID();
    const expires = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
    
    this.sessions.set(sessionId, { userId, expires, ip });
    return sessionId;
  }
  
  static validateSession(sessionId: string, ip: string): string | null {
    const session = this.sessions.get(sessionId);
    if (!session || session.expires < Date.now() || session.ip !== ip) {
      this.sessions.delete(sessionId);
      return null;
    }
    return session.userId;
  }
  
  static revokeSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
  
  static cleanup(): void {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (session.expires < now) {
        this.sessions.delete(id);
      }
    }
  }
}

// Initialize cleanup interval
setInterval(() => {
  SessionManager.cleanup();
  // Clean up expired CSRF tokens
  for (const [token, expiry] of csrfTokens) {
    if (Date.now() > expiry) {
      csrfTokens.delete(token);
    }
  }
}, 60 * 60 * 1000); // Every hour
