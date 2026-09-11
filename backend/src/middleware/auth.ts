import { Request, Response, NextFunction } from 'express';
import { jwtService, DatabaseUser } from '../services/jwtService.js';
import { logger } from '../utils/logger.js';

export interface UserPayload {
  id: number;
  email: string;
  role: 'user' | 'admin';
}

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
      tokenId?: string;
      requestId?: string;
    }
  }
}

export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return next();
  }

  try {
    const verified = await jwtService.verifyDatabaseToken(token);
    req.user = {
      id: verified.user.id,
      email: verified.user.email,
      role: verified.user.role,
    };
    req.tokenId = verified.tokenId;
  } catch (err: any) {
    logger.debug('Optional JWT authentication did not pass', {
      metadata: { reason: err?.message || String(err) },
    });
  }

  next();
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Database JWT token required in Authorization header (Bearer <token>)',
      },
    });
  }

  const token = authHeader.substring(7).trim();
  try {
    const verified = await jwtService.verifyDatabaseToken(token);
    req.user = {
      id: verified.user.id,
      email: verified.user.email,
      role: verified.user.role,
    };
    req.tokenId = verified.tokenId;
    next();
  } catch (err: any) {
    logger.warn('Unauthorized JWT database verification failed', {
      error: err?.message,
    });
    return res.status(401).json({
      error: {
        code: 'INVALID_OR_REVOKED_TOKEN',
        message: err?.message || 'Database JWT is invalid, expired, or has been revoked',
      },
    });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required for administrative operations',
      },
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'Administrator privileges required',
      },
    });
  }

  next();
}
