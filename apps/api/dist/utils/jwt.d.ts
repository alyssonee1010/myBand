/**
 * Generate a JWT token for a user
 */
export declare function generateToken(userId: string): string;
/**
 * Verify and decode a JWT token
 */
export declare function verifyToken(token: string): {
    userId: string;
} | null;
/**
 * Extract token from Authorization header or cookies
 */
export declare function extractToken(authHeader?: string, cookie?: string): string | null;
//# sourceMappingURL=jwt.d.ts.map