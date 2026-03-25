import jwt from 'jsonwebtoken';
function getJwtSecret() {
    const secret = process.env.JWT_SECRET?.trim();
    if (!secret) {
        throw new Error('JWT_SECRET is required. Set it in apps/api/.env or Railway service variables.');
    }
    return secret;
}
const JWT_SECRET = getJwtSecret();
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';
/**
 * Generate a JWT token for a user
 */
export function generateToken(userId) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
}
/**
 * Verify and decode a JWT token
 */
export function verifyToken(token) {
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (typeof decoded !== 'object' || decoded === null || !('userId' in decoded)) {
            return null;
        }
        const userId = decoded.userId;
        if (typeof userId !== 'string') {
            return null;
        }
        return { userId };
    }
    catch (error) {
        return null;
    }
}
/**
 * Extract token from Authorization header or cookies
 */
export function extractToken(authHeader, cookie) {
    // Check Authorization header (Bearer token)
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    // Check cookie
    if (cookie) {
        const match = cookie.match(/token=([^;]+)/);
        if (match)
            return match[1];
    }
    return null;
}
//# sourceMappingURL=jwt.js.map