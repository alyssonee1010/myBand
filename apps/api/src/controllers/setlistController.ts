import { Request, Response } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import { ApiError, asyncHandler } from '../utils/errors.js';

const prisma = new PrismaClient();

/**
 * Create a new setlist
 */
export const createSetlist = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  const { groupId } = req.params;
  const { name } = req.body;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  if (!name) {
    throw new ApiError(400, 'Setlist name is required');
  }

  // Check user is member of group
  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });

  if (!membership) {
    throw new ApiError(403, 'You are not a member of this group');
  }

  const setlist = await prisma.setlist.create({
    data: {
      name,
      groupId,
    },
    include: {
      items: {
        include: {
          content: true,
        },
        orderBy: {
          position: 'asc',
        },
      },
    },
  });

  res.status(201).json(setlist);
});

/**
 * Get all setlists for a group
 */
export const getGroupSetlists = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  const { groupId } = req.params;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  // Check user is member of group
  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });

  if (!membership) {
    throw new ApiError(403, 'You are not a member of this group');
  }

  const setlists = await prisma.setlist.findMany({
    where: { groupId },
    include: {
      items: {
        include: {
          content: true,
        },
        orderBy: {
          position: 'asc',
        },
      },
    },
  });

  res.json({ setlists });
});

/**
 * Get a single setlist
 */
export const getSetlist = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  const { setlistId } = req.params;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const setlist = await prisma.setlist.findUnique({
    where: { id: setlistId },
    include: {
      items: {
        include: {
          content: true,
        },
        orderBy: {
          position: 'asc',
        },
      },
      group: true,
    },
  });

  if (!setlist) {
    throw new ApiError(404, 'Setlist not found');
  }

  // Check user is member of group
  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId: setlist.groupId } },
  });

  if (!membership) {
    throw new ApiError(403, 'You are not a member of this group');
  }

  res.json(setlist);
});

/**
 * Add content to a setlist
 */
export const addItemToSetlist = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  const { setlistId } = req.params;
  const { contentId } = req.body;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  if (!contentId) {
    throw new ApiError(400, 'Content ID is required');
  }

  // Get setlist
  const setlist = await prisma.setlist.findUnique({
    where: { id: setlistId },
  });

  if (!setlist) {
    throw new ApiError(404, 'Setlist not found');
  }

  // Check user is member of group
  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId: setlist.groupId } },
  });

  if (!membership) {
    throw new ApiError(403, 'You are not a member of this group');
  }

  // Check content exists and belongs to same group
  const content = await prisma.content.findUnique({
    where: { id: contentId },
  });

  if (!content || content.groupId !== setlist.groupId) {
    throw new ApiError(404, 'Content not found or does not belong to this group');
  }

  const existingItem = await prisma.setlistItem.findFirst({
    where: {
      setlistId,
      contentId,
    },
  });

  if (existingItem) {
    throw new ApiError(409, 'This song is already in the setlist');
  }

  // Get next position
  const maxPosition = await prisma.setlistItem.findFirst({
    where: { setlistId },
    orderBy: { position: 'desc' },
    select: { position: true },
  });

  const nextPosition = (maxPosition?.position ?? -1) + 1;

  try {
    // Add item
    const item = await prisma.setlistItem.create({
      data: {
        setlistId,
        contentId,
        position: nextPosition,
      },
      include: {
        content: true,
      },
    });

    res.status(201).json(item);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ApiError(409, 'This song is already in the setlist');
    }

    throw error;
  }
});

/**
 * Reorder items in a setlist (for drag and drop)
 */
export const reorderSetlistItems = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  const { setlistId } = req.params;
  const { items } = req.body; // Array of { itemId, position }

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  if (!Array.isArray(items)) {
    throw new ApiError(400, 'Items must be an array of { itemId, position }');
  }

  // Get setlist and verify ownership
  const setlist = await prisma.setlist.findUnique({
    where: { id: setlistId },
  });

  if (!setlist) {
    throw new ApiError(404, 'Setlist not found');
  }

  // Check user is member of group
  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId: setlist.groupId } },
  });

  if (!membership) {
    throw new ApiError(403, 'You are not a member of this group');
  }

  const currentItems = await prisma.setlistItem.findMany({
    where: { setlistId },
    select: { id: true },
  });

  if (currentItems.length !== items.length) {
    throw new ApiError(400, 'The reorder request must include every song in the setlist');
  }

  const currentItemIds = new Set(currentItems.map((item) => item.id));
  const requestedItemIds = items.map((item) => item.itemId);
  const requestedItemIdSet = new Set(requestedItemIds);

  if (
    requestedItemIds.length !== requestedItemIdSet.size ||
    requestedItemIds.some((itemId) => !currentItemIds.has(itemId))
  ) {
    throw new ApiError(400, 'The reorder request contains invalid setlist items');
  }

  await prisma.$transaction(async (tx) => {
    for (const [index, item] of items.entries()) {
      await tx.setlistItem.update({
        where: { id: item.itemId },
        data: { position: -(index + 1) },
      });
    }

    for (const [index, item] of items.entries()) {
      await tx.setlistItem.update({
        where: { id: item.itemId },
        data: { position: index },
      });
    }
  });

  // Fetch updated setlist
  const updatedSetlist = await prisma.setlist.findUnique({
    where: { id: setlistId },
    include: {
      items: {
        include: {
          content: true,
        },
        orderBy: {
          position: 'asc',
        },
      },
    },
  });

  res.json(updatedSetlist);
});

/**
 * Delete a setlist
 */
export const deleteSetlist = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  const { setlistId } = req.params;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const setlist = await prisma.setlist.findUnique({
    where: { id: setlistId },
  });

  if (!setlist) {
    throw new ApiError(404, 'Setlist not found');
  }

  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId: setlist.groupId } },
  });

  if (!membership) {
    throw new ApiError(403, 'You are not a member of this group');
  }

  await prisma.setlist.delete({
    where: { id: setlistId },
  });

  res.json({ message: 'Setlist deleted' });
});

/**
 * Remove item from setlist
 */
export const removeItemFromSetlist = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  const { itemId } = req.params;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  // Get item
  const item = await prisma.setlistItem.findUnique({
    where: { id: itemId },
    include: { setlist: true },
  });

  if (!item) {
    throw new ApiError(404, 'Item not found');
  }

  // Check user is member of group
  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId: item.setlist.groupId } },
  });

  if (!membership) {
    throw new ApiError(403, 'You are not a member of this group');
  }

  // Delete item
  await prisma.setlistItem.delete({
    where: { id: itemId },
  });

  res.json({ message: 'Item removed from setlist' });
});
