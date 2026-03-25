import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/crypto.js';
import { generateToken } from '../utils/jwt.js';
import { ApiError, asyncHandler } from '../utils/errors.js';
import { normalizeEmail } from '../utils/email.js';
const prisma = new PrismaClient();
/**
 * Register a new user
 */
export const register = asyncHandler(async (req, res) => {
    const { email, password, name } = req.body;
    const normalizedEmail = email ? normalizeEmail(email) : '';
    // Validation
    if (!normalizedEmail || !password) {
        throw new ApiError(400, 'Email and password are required');
    }
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
        where: {
            email: {
                equals: normalizedEmail,
                mode: 'insensitive',
            },
        },
    });
    if (existingUser) {
        throw new ApiError(400, 'Email already registered');
    }
    // Hash password
    const hashedPassword = await hashPassword(password);
    // Create user
    const user = await prisma.user.create({
        data: {
            email: normalizedEmail,
            password: hashedPassword,
            name: name || normalizedEmail.split('@')[0],
        },
    });
    await prisma.groupInvitation.updateMany({
        where: {
            email: normalizedEmail,
            inviteeId: null,
            status: 'pending',
        },
        data: {
            inviteeId: user.id,
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
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const normalizedEmail = email ? normalizeEmail(email) : '';
    if (!normalizedEmail || !password) {
        throw new ApiError(400, 'Email and password are required');
    }
    // Find user
    const user = await prisma.user.findFirst({
        where: {
            email: {
                equals: normalizedEmail,
                mode: 'insensitive',
            },
        },
    });
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
    console.log(`[AUTH] Login successful for user ${normalizedEmail}, token issued`);
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
export const getProfile = asyncHandler(async (req, res) => {
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
            receivedInvitations: {
                where: {
                    status: 'pending',
                },
                include: {
                    group: true,
                    invitedBy: {
                        select: {
                            id: true,
                            email: true,
                            name: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
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
            pendingInvitations: user.receivedInvitations,
        },
    });
});
//# sourceMappingURL=authController.js.map