import bcryptjs from 'bcryptjs';
import { randomBytes } from 'crypto';
const SALT_ROUNDS = 10;
/**
 * Hash a password for secure storage
 */
export async function hashPassword(password) {
    return bcryptjs.hash(password, SALT_ROUNDS);
}
/**
 * Compare a password with its hash
 */
export async function comparePassword(password, hash) {
    return bcryptjs.compare(password, hash);
}
/**
 * Generate a secure token for shareable group join links
 */
export function generateJoinLinkToken() {
    return randomBytes(32).toString('hex');
}
//# sourceMappingURL=crypto.js.map