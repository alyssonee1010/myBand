import { Request, Response, NextFunction } from 'express';

export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Global error handler middleware
 */
export function errorHandler(
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('[ERROR]', {
    name: err.name,
    message: err.message,
    statusCode: err instanceof ApiError ? err.statusCode : 500,
    path: req.path,
    method: req.method,
  });

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      error: err.message,
      status: err.statusCode,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Default 500 error
  res.status(500).json({
    error: 'Internal server error',
    status: 500,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Async route wrapper to catch errors
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => any) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
