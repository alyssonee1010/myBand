/**
 * Hash a password for secure storage
 */
export declare function hashPassword(password: string): Promise<string>;
/**
 * Compare a password with its hash
 */
export declare function comparePassword(password: string, hash: string): Promise<boolean>;
//# sourceMappingURL=crypto.d.ts.map