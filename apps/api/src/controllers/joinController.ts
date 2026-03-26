import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiError, asyncHandler } from '../utils/errors.js';

const prisma = new PrismaClient();
const userSelection = {
  id: true,
  email: true,
  name: true,
};
const joinLinkGroupSelection = {
  id: true,
  name: true,
  description: true,
};

async function findJoinLinkByToken(token: string) {
  return prisma.groupJoinLink.findUnique({
    where: { token },
    include: {
      group: {
        select: joinLinkGroupSelection,
      },
    },
  });
}

/**
 * Resolve a public group join link into safe preview data
 */
export const resolveGroupJoinLink = asyncHandler(async (req: Request, res: Response) => {
  const token = typeof req.params.token === 'string' ? req.params.token.trim() : '';

  if (!token) {
    throw new ApiError(400, 'Join link token is required');
  }

  const joinLink = await findJoinLinkByToken(token);

  if (!joinLink) {
    throw new ApiError(404, 'This band link is invalid or has been replaced');
  }

  if (!joinLink.isActive) {
    throw new ApiError(410, 'This band link has been disabled');
  }

  res.json({
    group: joinLink.group,
  });
});

/**
 * Join a group through a reusable link after authenticating
 */
export const joinGroupFromLink = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  const token = typeof req.params.token === 'string' ? req.params.token.trim() : '';

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  if (!token) {
    throw new ApiError(400, 'Join link token is required');
  }

  const joinLink = await findJoinLinkByToken(token);

  if (!joinLink) {
    throw new ApiError(404, 'This band link is invalid or has been replaced');
  }

  if (!joinLink.isActive) {
    throw new ApiError(410, 'This band link has been disabled');
  }

  const existingMembership = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId: joinLink.groupId,
      },
    },
    include: {
      user: {
        select: userSelection,
      },
    },
  });

  if (existingMembership) {
    res.json({
      alreadyMember: true,
      group: joinLink.group,
      membership: existingMembership,
    });
    return;
  }

  const membership = await prisma.groupMember.create({
    data: {
      userId,
      groupId: joinLink.groupId,
      role: 'member',
    },
    include: {
      user: {
        select: userSelection,
      },
    },
  });

  res.status(201).json({
    alreadyMember: false,
    group: joinLink.group,
    membership,
  });
});
