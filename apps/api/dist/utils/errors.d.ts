import { Request, Response, NextFunction } from 'express';
export declare class ApiError extends Error {
    statusCode: number;
    constructor(statusCode: number, message: string);
}
/**
 * Global error handler middleware
 */
export declare function errorHandler(err: Error | ApiError, req: Request, res: Response, next: NextFunction): void;
/**
 * Async route wrapper to catch errors
 */
export declare function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=errors.d.ts.map