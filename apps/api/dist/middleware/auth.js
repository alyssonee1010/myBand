import { extractToken, verifyToken } from '../utils/jwt.js';
import { ApiError } from '../utils/errors.js';
/**
 * Middleware to verify JWT token and attach userId to request
 */
export function authMiddleware(req, res, next) {
    try {
        const token = extractToken(req.headers.authorization, req.headers.cookie);
        if (!token) {
            throw new ApiError(401, 'No token provided');
        }
        const decoded = verifyToken(token);
        if (!decoded) {
            throw new ApiError(401, 'Invalid or expired token');
        }
        req.userId = decoded.userId;
        next();
    }
    catch (err) {
        // Pass error to Express error handler
        next(err);
    }
}
/**
 * Middleware to allow CORS and preflight requests
 */
export function corsMiddleware(req, res, next) {
    const configuredOrigins = process.env.ALLOWED_ORIGINS
        ?.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    const allowedOrigins = new Set(configuredOrigins?.length
        ? configuredOrigins
        : [
            process.env.FRONTEND_URL || 'http://localhost:3000',
            'http://localhost',
            'capacitor://localhost',
            'ionic://localhost',
        ]);
    const requestOrigin = req.headers.origin;
    if (requestOrigin && allowedOrigins.has(requestOrigin)) {
        res.header('Access-Control-Allow-Origin', requestOrigin);
        res.header('Vary', 'Origin');
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
        return;
    }
    next();
}
//# sourceMappingURL=auth.js.map