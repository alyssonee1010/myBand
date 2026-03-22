export class ApiError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'ApiError';
    }
}
/**
 * Global error handler middleware
 */
export function errorHandler(err, req, res, next) {
    console.error('[ERROR]', err);
    if (err instanceof ApiError) {
        res.status(err.statusCode).json({
            error: err.message,
            status: err.statusCode,
        });
        return;
    }
    // Default 500 error
    res.status(500).json({
        error: 'Internal server error',
        status: 500,
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