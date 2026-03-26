import { Router } from 'express';
import { resolveGroupJoinLink, joinGroupFromLink } from '../controllers/joinController.js';
import { asyncHandler } from '../utils/errors.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

/**
 * @route GET /api/join/:token
 * @desc Resolve a public join link into safe preview data
 */
router.get('/:token', asyncHandler(resolveGroupJoinLink));

/**
 * @route POST /api/join/:token/join
 * @desc Join a group from a reusable link after authenticating
 */
router.post('/:token/join', authMiddleware, asyncHandler(joinGroupFromLink));

export default router;
