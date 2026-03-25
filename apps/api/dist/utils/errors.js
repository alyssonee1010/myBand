export class ApiError extends Error {
    constructor(statusCode, message, code, details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.name = 'ApiError';
    }
}
/**
 * Global error handler middleware
 */
export function errorHandler(err, req, res, next) {
    console.error('[ERROR]', {
        name: err.name,
        message: err.message,
        statusCode: err instanceof ApiError ? err.statusCode : 500,
        path: req.path,
        method: req.method,
    });
    if (err instanceof ApiError) {
        const retryAfterSeconds = typeof err.details?.retryAfterSeconds === 'number' ? err.details.retryAfterSeconds : undefined;
        if (retryAfterSeconds) {
            res.setHeader('Retry-After', String(retryAfterSeconds));
        }
        res.status(err.statusCode).json({
            error: err.message,
            code: err.code,
            details: err.details,
            retryAfterSeconds,
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
export function asyncHandler(fn) {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
//# sourceMappingURL=errors.js.map