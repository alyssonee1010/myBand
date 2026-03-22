import { Router } from 'express';
import { register, login, getProfile } from '../controllers/authController';
import { asyncHandler } from '../utils/errors';
const router = Router();
/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @body { email, password, name? }
 */
router.post('/register', asyncHandler(register));
/**
 * @route POST /api/auth/login
 * @desc Login a user
 * @body { email, password }
 */
router.post('/login', asyncHandler(login));
/**
 * @route GET /api/auth/me
 * @desc Get current user profile (protected)
 */
router.get('/me', asyncHandler(getProfile));
export default router;
//# sourceMappingURL=auth.js.map