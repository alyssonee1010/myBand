import bcryptjs from 'bcryptjs';
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
//# sourceMappingURL=crypto.js.map