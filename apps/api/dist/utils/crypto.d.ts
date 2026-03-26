/**
 * Hash a password for secure storage
 */
export declare function hashPassword(password: string): Promise<string>;
/**
 * Compare a password with its hash
 */
export declare function comparePassword(password: string, hash: string): Promise<boolean>;
/**
 * Generate a secure token for shareable group join links
 */
export declare function generateJoinLinkToken(): string;
//# sourceMappingURL=crypto.d.ts.map