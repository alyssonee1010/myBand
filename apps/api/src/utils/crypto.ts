import bcryptjs from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hash a password for secure storage
 */
export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, SALT_ROUNDS);
}

/**
 * Compare a password with its hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}
