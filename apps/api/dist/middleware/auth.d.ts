import { Request, Response, NextFunction } from 'express';
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
export declare function authMiddleware(req: Request, res: Response, next: NextFunction): void;
/**
 * Middleware to allow CORS and preflight requests
 */
export declare function corsMiddleware(req: Request, res: Response, next: NextFunction): void;
//# sourceMappingURL=auth.d.ts.map