import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { User } from '../models/index.js';
import type { UserProfile } from '@turboorder/shared';

/** Extend Express Request with authenticated user */
declare global {
  namespace Express {
    interface Request {
      user?: UserProfile;
    }
  }
}

/**
 * JWT authentication middleware.
 * Verifies access token from Authorization header.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: { code: 'AUTH_REQUIRED', message: 'errors.auth.required' },
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };

    // Attach minimal user info to request
    req.user = {
      id: decoded.userId,
      email: '',
      name: '',
      locale: 'vi',
    };

    next();
  } catch {
    res.status(401).json({
      success: false,
      error: { code: 'AUTH_INVALID_TOKEN', message: 'errors.auth.invalid_token' },
    });
  }
}
