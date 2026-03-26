import { Router } from 'express';
import {
  createGroup,
  getUserGroups,
  getGroup,
  inviteMemberToGroup,
  revokeGroupInvitation,
  acceptGroupInvitation,
  getGroupJoinLink,
  createOrRegenerateGroupJoinLink,
  disableGroupJoinLink,
} from '../controllers/groupController.js';
import { asyncHandler } from '../utils/errors.js';
import { authMiddleware } from '../middleware/auth.js';

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

/**
 * @route GET /api/groups/:groupId/join-link
 * @desc Get the active reusable join link for a group
 */
router.get('/:groupId/join-link', asyncHandler(getGroupJoinLink));

/**
 * @route POST /api/groups/:groupId/join-link
 * @desc Create or regenerate the reusable join link for a group
 */
router.post('/:groupId/join-link', asyncHandler(createOrRegenerateGroupJoinLink));

/**
 * @route DELETE /api/groups/:groupId/join-link
 * @desc Disable the reusable join link for a group
 */
router.delete('/:groupId/join-link', asyncHandler(disableGroupJoinLink));

export default router;
