import { Request, Response, NextFunction } from 'express';
export declare class ApiError extends Error {
    statusCode: number;
    code?: string | undefined;
    constructor(statusCode: number, message: string, code?: string | undefined);
}
/**
 * Global error handler middleware
 */
export declare function errorHandler(err: Error | ApiError, req: Request, res: Response, next: NextFunction): void;
/**
 * Async route wrapper to catch errors
 */
export declare function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => any): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=errors.d.ts.map