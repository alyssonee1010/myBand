import jwt from 'jsonwebtoken';
const JWT_SECRET = (process.env.JWT_SECRET || 'your-secret-key');
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
        return decoded;
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