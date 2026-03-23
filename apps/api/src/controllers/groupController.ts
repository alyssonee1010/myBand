import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiError, asyncHandler } from '../utils/errors';
import { normalizeEmail } from '../utils/email';

const prisma = new PrismaClient();
const userSelection = {
  id: true,
  email: true,
  name: true,
};

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
            select: userSelection,
          },
        },
      },
      invitations: {
        where: {
          status: 'pending',
        },
        include: {
          invitedBy: {
            select: userSelection,
          },
          invitee: {
            select: userSelection,
          },
        },
        orderBy: {
          createdAt: 'desc',
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
 * Invite a user to a group via email
 */
export const inviteMemberToGroup = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  const { groupId } = req.params;
  const normalizedEmail = req.body.email ? normalizeEmail(req.body.email) : '';

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  if (!normalizedEmail) {
    throw new ApiError(400, 'Email is required');
  }

  // Check requester is admin
  const adminMembership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });

  if (!adminMembership || adminMembership.role !== 'admin') {
    throw new ApiError(403, 'Only admins can invite members');
  }

  const targetUser = await prisma.user.findFirst({
    where: {
      email: {
        equals: normalizedEmail,
        mode: 'insensitive',
      },
    },
  });

  if (targetUser) {
    const existingMembership = await prisma.groupMember.findUnique({
      where: { userId_groupId: { userId: targetUser.id, groupId } },
    });

    if (existingMembership) {
      throw new ApiError(400, 'User is already a member of this group');
    }
  }

  const existingInvitation = await prisma.groupInvitation.findUnique({
    where: {
      groupId_email: {
        groupId,
        email: normalizedEmail,
      },
    },
  });

  if (existingInvitation?.status === 'pending') {
    throw new ApiError(400, 'Invitation is already pending for this email');
  }

  const invitation = existingInvitation
    ? await prisma.groupInvitation.update({
        where: { id: existingInvitation.id },
        data: {
          invitedById: userId,
          inviteeId: targetUser?.id ?? existingInvitation.inviteeId ?? null,
          status: 'pending',
          respondedAt: null,
        },
        include: {
          invitedBy: {
            select: userSelection,
          },
          invitee: {
            select: userSelection,
          },
        },
      })
    : await prisma.groupInvitation.create({
        data: {
          email: normalizedEmail,
          groupId,
          invitedById: userId,
          inviteeId: targetUser?.id,
        },
        include: {
          invitedBy: {
            select: userSelection,
          },
          invitee: {
            select: userSelection,
          },
        },
      });

  res.status(existingInvitation ? 200 : 201).json(invitation);
});

/**
 * Revoke a pending invitation so it no longer appears or can be accepted
 */
export const revokeGroupInvitation = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  const { groupId, invitationId } = req.params;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const adminMembership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });

  if (!adminMembership || adminMembership.role !== 'admin') {
    throw new ApiError(403, 'Only admins can remove pending invitations');
  }

  const invitation = await prisma.groupInvitation.findUnique({
    where: { id: invitationId },
    include: {
      group: true,
      invitedBy: {
        select: userSelection,
      },
      invitee: {
        select: userSelection,
      },
    },
  });

  if (!invitation || invitation.groupId !== groupId) {
    throw new ApiError(404, 'Invitation not found');
  }

  if (invitation.status !== 'pending') {
    throw new ApiError(400, 'Invitation is no longer pending');
  }

  const revokedInvitation = await prisma.groupInvitation.update({
    where: { id: invitationId },
    data: {
      status: 'revoked',
      respondedAt: new Date(),
    },
    include: {
      group: true,
      invitedBy: {
        select: userSelection,
      },
      invitee: {
        select: userSelection,
      },
    },
  });

  res.json({
    invitation: revokedInvitation,
  });
});

/**
 * Accept a pending invitation and join the group
 */
export const acceptGroupInvitation = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  const { groupId, invitationId } = req.params;

  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: userSelection,
  });

  if (!currentUser) {
    throw new ApiError(404, 'User not found');
  }

  const invitation = await prisma.groupInvitation.findUnique({
    where: { id: invitationId },
    include: {
      group: true,
      invitedBy: {
        select: userSelection,
      },
      invitee: {
        select: userSelection,
      },
    },
  });

  if (!invitation || invitation.groupId !== groupId) {
    throw new ApiError(404, 'Invitation not found');
  }

  if (invitation.status !== 'pending') {
    throw new ApiError(400, 'Invitation has already been accepted');
  }

  const canAcceptInvitation =
    invitation.inviteeId === userId ||
    normalizeEmail(invitation.email) === normalizeEmail(currentUser.email);

  if (!canAcceptInvitation) {
    throw new ApiError(403, 'This invitation is not for your account');
  }

  const existingMembership = await prisma.groupMember.findUnique({
    where: { userId_groupId: { userId, groupId } },
    include: {
      user: {
        select: userSelection,
      },
    },
  });

  if (existingMembership) {
    const acceptedInvitation = await prisma.groupInvitation.update({
      where: { id: invitationId },
      data: {
        inviteeId: userId,
        status: 'accepted',
        respondedAt: new Date(),
      },
      include: {
        group: true,
        invitedBy: {
          select: userSelection,
        },
        invitee: {
          select: userSelection,
        },
      },
    });

    res.json({
      invitation: acceptedInvitation,
      membership: existingMembership,
      group: acceptedInvitation.group,
    });
    return;
  }

  const acceptedAt = new Date();
  const result = await prisma.$transaction(async (tx) => {
    const membership = await tx.groupMember.create({
      data: {
        userId,
        groupId,
        role: 'member',
      },
      include: {
        user: {
          select: userSelection,
        },
      },
    });

    const acceptedInvitation = await tx.groupInvitation.update({
      where: { id: invitationId },
      data: {
        inviteeId: userId,
        status: 'accepted',
        respondedAt: acceptedAt,
      },
      include: {
        group: true,
        invitedBy: {
          select: userSelection,
        },
        invitee: {
          select: userSelection,
        },
      },
    });

    return {
      membership,
      invitation: acceptedInvitation,
      group: acceptedInvitation.group,
    };
  });

  res.json(result);
});
