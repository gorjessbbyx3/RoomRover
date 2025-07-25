
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';

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

// Advanced JWT implementation
export class TokenManager {
  private static readonly JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret';
  private static readonly JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret';
  
  static generateTokenPair(userId: string, role: string) {
    const accessToken = jwt.sign(
      { userId, role, type: 'access' },
      this.JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    const refreshToken = jwt.sign(
      { userId, role, type: 'refresh' },
      this.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    
    return { accessToken, refreshToken };
  }
  
  static verifyAccessToken(token: string) {
    return jwt.verify(token, this.JWT_SECRET);
  }
  
  static verifyRefreshToken(token: string) {
    return jwt.verify(token, this.JWT_REFRESH_SECRET);
  }
}

// Advanced audit logging
export class SecurityAuditLogger {
  static async logSecurityEvent(event: {
    userId?: string;
    action: string;
    resource: string;
    ip: string;
    userAgent: string;
    success: boolean;
    details?: any;
  }) {
    // Log to database and external security monitoring
    console.log(`[SECURITY] ${event.action} on ${event.resource} by ${event.userId} from ${event.ip}: ${event.success ? 'SUCCESS' : 'FAILED'}`);
    
    // In production, send to security monitoring service
    if (process.env.SECURITY_WEBHOOK) {
      try {
        await fetch(process.env.SECURITY_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            severity: event.success ? 'info' : 'warning',
            ...event
          })
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
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      res.status(400).json({ error: 'Invalid input data', details: error });
    }
  };
}

// Content Security Policy
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "wss:", "ws:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});
