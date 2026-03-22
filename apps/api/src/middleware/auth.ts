import { Request, Response, NextFunction } from 'express';
import { extractToken, verifyToken } from '../utils/jwt';
import { ApiError } from '../utils/errors';

// Extend Express Request to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * Middleware to verify JWT token and attach userId to request
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const token = extractToken(req.headers.authorization, req.headers.cookie as string);

    if (!token) {
      throw new ApiError(401, 'No token provided');
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      throw new ApiError(401, 'Invalid or expired token');
    }

    req.userId = decoded.userId;
    next();
  } catch (err) {
    // Pass error to Express error handler
    next(err);
  }
}

/**
 * Middleware to allow CORS and preflight requests
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

  res.header('Access-Control-Allow-Origin', FRONTEND_URL);
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
}
