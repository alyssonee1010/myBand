import { Router } from 'express';
import { createGroup, getUserGroups, getGroup, addMemberToGroup, } from '../controllers/groupController';
import { asyncHandler } from '../utils/errors';
const router = Router();
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
 * @route POST /api/groups/:groupId/members
 * @desc Add a user to a group by email
 * @body { email }
 */
router.post('/:groupId/members', asyncHandler(addMemberToGroup));
export default router;
//# sourceMappingURL=groups.js.map