import { Router } from 'express';
import { register, login, getProfile, verifyEmail, resendVerificationEmail, deleteAccount, } from '../controllers/authController.js';
import { asyncHandler } from '../utils/errors.js';
import { authMiddleware } from '../middleware/auth.js';
const router = Router();
/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @body { email, password, name? }
 */
router.post('/register', asyncHandler(register));
/**
 * @route POST /api/auth/verify-email
 * @desc Verify an email address and sign the user in
 * @body { token }
 */
router.post('/verify-email', asyncHandler(verifyEmail));
/**
 * @route POST /api/auth/resend-verification
 * @desc Resend the email verification link
 * @body { email }
 */
router.post('/resend-verification', asyncHandler(resendVerificationEmail));
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
router.get('/me', authMiddleware, asyncHandler(getProfile));
/**
 * @route DELETE /api/auth/account
 * @desc Delete the authenticated user's account
 * @body { password }
 */
router.delete('/account', authMiddleware, asyncHandler(deleteAccount));
export default router;
//# sourceMappingURL=auth.js.map