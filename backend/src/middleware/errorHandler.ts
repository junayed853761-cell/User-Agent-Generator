import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export function errorHandler(err: AppError, req: Request, res: Response, _next: NextFunction) {
  const statusCode = err.statusCode || 500;
  const code = err.code || (statusCode === 404 ? 'NOT_FOUND' : 'INTERNAL_SERVER_ERROR');
  const message = err.message || 'An unexpected error occurred';

  const requestId = (req.headers['x-request-id'] as string) || '';

  logger.error(`Error processing ${req.method} ${req.path}: ${message}`, err, {
    requestId,
    endpoint: req.path,
    method: req.method,
    status: statusCode,
  });

  return res.status(statusCode).json({
    error: {
      code,
      message,
      ...(err.details ? { details: err.details } : {}),
    },
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
  });
}
