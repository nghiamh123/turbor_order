import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema, ZodError } from 'zod';

/** Extend Express Request with parsed query data */
declare global {
  namespace Express {
    interface Request {
      parsedQuery?: Record<string, unknown>;
    }
  }
}

/**
 * Request validation middleware using Zod schemas.
 * Validates body, query, or params based on the schema location.
 *
 * Note: In Express 5, req.query is read-only. Parsed query data
 * is stored on req.parsedQuery instead.
 */
export function validate(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const data = req[source];
    const result = schema.safeParse(data);

    if (!result.success) {
      const details = (result.error as ZodError).issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'errors.validation.failed',
          details,
        },
      });
      return;
    }

    // Express 5: req.query is read-only, so store parsed data separately
    if (source === 'query') {
      req.parsedQuery = result.data;
    } else {
      req[source] = result.data;
    }
    next();
  };
}
