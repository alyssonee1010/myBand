import { Router } from 'express';
import {
  createGroup,
  getUserGroups,
  getGroup,
  inviteMemberToGroup,
  revokeGroupInvitation,
  acceptGroupInvitation,
} from '../controllers/groupController';
import { asyncHandler } from '../utils/errors';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * @route POST /api/groups
 * @desc Create a new group
 * @body { name, description? }
 */
router.post('/', asyncHandler(createGroup));

/**
 * @route GET /api/groups
 * @desc Get all groups for current user
 */
router.get('/', asyncHandler(getUserGroups));

/**
 * @route GET /api/groups/:groupId
 * @desc Get a single group with members and content
 */
router.get('/:groupId', asyncHandler(getGroup));

/**
 * @route POST /api/groups/:groupId/invitations
 * @desc Create a pending group invitation by email
 * @body { email }
 */
router.post('/:groupId/invitations', asyncHandler(inviteMemberToGroup));

/**
 * @route DELETE /api/groups/:groupId/invitations/:invitationId
 * @desc Revoke a pending invitation so it can no longer be accepted
 */
router.delete('/:groupId/invitations/:invitationId', asyncHandler(revokeGroupInvitation));

/**
 * @route POST /api/groups/:groupId/invitations/:invitationId/accept
 * @desc Accept a pending invitation and join the group
 */
router.post('/:groupId/invitations/:invitationId/accept', asyncHandler(acceptGroupInvitation));

export default router;
