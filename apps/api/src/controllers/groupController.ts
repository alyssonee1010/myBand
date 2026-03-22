import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiError, asyncHandler } from '../utils/errors';

const prisma = new PrismaClient();

/**
 * Create a new group (band)
 */
export const createGroup = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  const { name, description } = req.body;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  if (!name) {
    throw new ApiError(400, 'Group name is required');
  }

  // Create group and add creator as admin member
  const group = await prisma.group.create({
    data: {
      name,
      description,
      members: {
        create: {
          userId,
          role: 'admin',
        },
      },
    },
    include: {
      members: true,
    },
  });

  res.status(201).json(group);
});

/**
 * Get all groups for current user
 */
export const getUserGroups = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const memberships = await prisma.groupMember.findMany({
    where: { userId },
    include: {
      group: true,
    },
  });

  const groups = memberships.map((m) => m.group);
  res.json({ groups });
});

/**
 * Get a single group by ID
 */
export const getGroup = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  const { groupId } = req.params;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  // Verify user is a member
  const membership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });

  if (!membership) {
    throw new ApiError(403, 'You are not a member of this group');
  }

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, email: true, name: true },
          },
        },
      },
      contents: true,
      setlists: true,
    },
  });

  if (!group) {
    throw new ApiError(404, 'Group not found');
  }

  res.json(group);
});

/**
 * Add a user to a group via email
 */
export const addMemberToGroup = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  const { groupId } = req.params;
  const { email } = req.body;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  if (!email) {
    throw new ApiError(400, 'Email is required');
  }

  // Check requester is admin
  const adminMembership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });

  if (!adminMembership || adminMembership.role !== 'admin') {
    throw new ApiError(403, 'Only admins can add members');
  }

  // Find user by email
  const targetUser = await prisma.user.findUnique({ where: { email } });
  if (!targetUser) {
    throw new ApiError(404, 'User not found');
  }

  // Check if already a member
  const existingMembership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId: targetUser.id, groupId } },
  });

  if (existingMembership) {
    throw new ApiError(400, 'User is already a member of this group');
  }

  // Add member
  const newMembership = await prisma.groupMember.create({
    data: {
      userId: targetUser.id,
      groupId,
      role: 'member',
    },
    include: {
      user: {
        select: { id: true, email: true, name: true },
      },
    },
  });

  res.status(201).json(newMembership);
});
