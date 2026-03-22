import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ApiError, asyncHandler } from '../utils/errors';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

/**
 * Upload a file (PDF or image)
 */
export const uploadContent = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  const { groupId } = req.params;
  const { title, description } = req.body;

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

  if (!req.file) {
    throw new ApiError(400, 'No file provided');
  }

  if (!title) {
    throw new ApiError(400, 'Title is required');
  }

  // Determine content type from MIME type
  let contentType = 'pdf';
  if (req.file.mimetype.startsWith('image/')) {
    contentType = 'image';
  }

  // Save file info to database
  const fileSizeKb = Math.ceil(req.file.size / 1024);

  const content = await prisma.content.create({
    data: {
      title,
      description,
      contentType,
      fileUrl: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      fileSizeKb,
      groupId,
      createdById: userId,
    },
  });

  res.status(201).json(content);
});

/**
 * Add text content (lyrics or chords)
 */
export const addTextContent = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  const { groupId } = req.params;
  const { title, description, textContent, contentType } = req.body;

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

  if (!title || !textContent || !contentType) {
    throw new ApiError(400, 'Title, text content, and content type are required');
  }

  if (!['lyrics', 'chords'].includes(contentType)) {
    throw new ApiError(400, 'Content type must be "lyrics" or "chords"');
  }

  const content = await prisma.content.create({
    data: {
      title,
      description,
      contentType,
      textContent,
      groupId,
      createdById: userId,
    },
  });

  res.status(201).json(content);
});

/**
 * Get all content in a group
 */
export const getGroupContent = asyncHandler(async (req: Request, res: Response) => {
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

  const contents = await prisma.content.findMany({
    where: { groupId },
    include: {
      createdBy: {
        select: { id: true, email: true, name: true },
      },
    },
  });

  res.json({ contents });
});

/**
 * Delete content
 */
export const deleteContent = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  const { groupId, contentId } = req.params;

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

  // Check ownership
  const content = await prisma.content.findUnique({
    where: { id: contentId },
  });

  if (!content) {
    throw new ApiError(404, 'Content not found');
  }

  if (content.createdById !== userId) {
    throw new ApiError(403, 'You can only delete your own content');
  }

  // Delete file if exists
  if (content.fileUrl) {
    const filePath = path.join(UPLOAD_DIR, path.basename(content.fileUrl));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  // Delete from database
  await prisma.content.delete({
    where: { id: contentId },
  });

  res.json({ message: 'Content deleted' });
});
