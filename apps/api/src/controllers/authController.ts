import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/crypto';
import { generateToken } from '../utils/jwt';
import { ApiError, asyncHandler } from '../utils/errors';

const prisma = new PrismaClient();

/**
 * Register a new user
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  // Validation
  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new ApiError(400, 'Email already registered');
  }

  // Hash password
  const hashedPassword = await hashPassword(password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: name || email.split('@')[0],
    },
  });

  // Generate token
  const token = generateToken(user.id);

  res.status(201).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  });
});

/**
 * Login a user
 */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }
  // Find user
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Verify password
  const isPasswordValid = await comparePassword(password, user.password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Invalid email or password');
  }

  // Generate token
  const token = generateToken(user.id);
  console.log(`[AUTH] Login successful for user ${email}, token issued`);

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  });
});

/**
 * Get current user profile
 */
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    throw new ApiError(401, 'Unauthorized');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      memberships: {
        include: {
          group: true,
        },
      },
    },
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      groups: user.memberships.map((m) => m.group),
    },
  });
});
