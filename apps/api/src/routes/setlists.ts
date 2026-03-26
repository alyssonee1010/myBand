import { Router } from 'express';
import {
  createSetlist,
  getGroupSetlists,
  getSetlist,
  addItemToSetlist,
  reorderSetlistItems,
  deleteSetlist,
  removeItemFromSetlist,
} from '../controllers/setlistController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router({ mergeParams: true }); // Allow inherited params like groupId

// Apply auth middleware to all routes
router.use(authMiddleware);

/**
 * @route POST /api/groups/:groupId/setlists
 * @desc Create a new setlist
 * @body { name }
 */
router.post('/', createSetlist);

/**
 * @route GET /api/groups/:groupId/setlists
 * @desc Get all setlists for a group
 */
router.get('/', getGroupSetlists);

/**
 * @route GET /api/groups/:groupId/setlists/:setlistId
 * @desc Get a single setlist with items
 */
router.get('/:setlistId', getSetlist);

/**
 * @route POST /api/groups/:groupId/setlists/:setlistId/items
 * @desc Add content to a setlist
 * @body { contentId }
 */
router.post('/:setlistId/items', addItemToSetlist);

/**
 * @route PUT /api/groups/:groupId/setlists/:setlistId/items
 * @desc Reorder items in a setlist
 * @body { items: [{ itemId, position }, ...] }
 */
router.put('/:setlistId/items', reorderSetlistItems);

/**
 * @route DELETE /api/groups/:groupId/setlists/:setlistId
 * @desc Delete a setlist
 */
router.delete('/:setlistId', deleteSetlist);

/**
 * @route DELETE /api/groups/:groupId/setlists/:setlistId/items/:itemId
 * @desc Remove an item from a setlist
 */
router.delete('/:setlistId/items/:itemId', removeItemFromSetlist);

export default router;
