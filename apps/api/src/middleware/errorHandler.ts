import type { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger.js';

/**
 * Global error handler middleware.
 * Catches all unhandled errors and returns standardized API responses.
 */
export function errorHandler(
  err: Error & { statusCode?: number; code?: string; details?: unknown[] },
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  // Log error (full stack for 500s, message for client errors)
  if (statusCode >= 500) {
    logger.error(`[${code}] ${err.message}`, { stack: err.stack });
  } else {
    logger.warn(`[${code}] ${err.message}`);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    },
  });
}

/**
 * Custom AppError class for throwing typed errors in controllers/services.
 */
export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: unknown[];

  constructor(statusCode: number, code: string, message: string, details?: unknown[]) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'AppError';
  }
}
