import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/crypto.js';
import { generateToken } from '../utils/jwt.js';
import { ApiError, asyncHandler } from '../utils/errors.js';
import { normalizeEmail, createEmailVerificationToken, getEmailVerificationExpiry, getEmailVerificationCooldownSeconds, getEmailVerificationRetryAfterSeconds, sendVerificationEmail, } from '../utils/email.js';
import fs from 'fs';
import path from 'path';
import { ensureUploadDirExists } from '../utils/uploads.js';
const prisma = new PrismaClient();
const UPLOAD_DIR = ensureUploadDirExists();
const EMAIL_NOT_VERIFIED_MESSAGE = 'Email address is not verified. Check your inbox for a verification link.';
const VERIFICATION_EMAIL_SENT_MESSAGE = 'Check your inbox to verify your email before logging in.';
const VERIFICATION_EMAIL_GENERIC_MESSAGE = 'If an account exists and still needs verification, a verification email has been sent.';
const EMAIL_VERIFICATION_RATE_LIMIT_CODE = 'EMAIL_VERIFICATION_RATE_LIMIT';
function getVerificationRetryAfterSecondsForUser(user) {
    return getEmailVerificationRetryAfterSeconds(user.emailVerificationLastSentAt ?? null);
}
function ensureEmailVerificationCanBeSent(user) {
    const retryAfterSeconds = getVerificationRetryAfterSecondsForUser(user);
    if (retryAfterSeconds > 0) {
        throw new ApiError(429, `Please wait ${retryAfterSeconds} seconds before requesting another verification email.`, EMAIL_VERIFICATION_RATE_LIMIT_CODE, { retryAfterSeconds });
    }
}
async function refreshEmailVerification(userId) {
    const emailVerificationToken = createEmailVerificationToken();
    const emailVerificationExpiresAt = getEmailVerificationExpiry();
    return prisma.user.update({
        where: { id: userId },
        data: {
            emailVerificationToken,
            emailVerificationExpiresAt,
            emailVerificationLastSentAt: new Date(),
        },
    });
}
async function sendEmailVerificationForUser(user) {
    ensureEmailVerificationCanBeSent(user);
    const updatedUser = await refreshEmailVerification(user.id);
    const emailResult = await sendVerificationEmail({
        email: updatedUser.email,
        name: updatedUser.name,
        token: updatedUser.emailVerificationToken,
    });
    return {
        emailResult,
        updatedUser,
        retryAfterSeconds: getEmailVerificationCooldownSeconds(),
    };
}
async function trySendEmailVerificationForUser(user) {
    ensureEmailVerificationCanBeSent(user);
    const updatedUser = await refreshEmailVerification(user.id);
    try {
        const emailResult = await sendVerificationEmail({
            email: updatedUser.email,
            name: updatedUser.name,
            token: updatedUser.emailVerificationToken,
        });
        return {
            emailResult,
            updatedUser,
            retryAfterSeconds: getEmailVerificationCooldownSeconds(),
        };
    }
    catch (error) {
        console.error('[EMAIL] Failed to send verification email', {
            email: updatedUser.email,
            message: error instanceof Error ? error.message : 'Unknown error',
        });
        return {
            updatedUser,
            emailResult: {
                delivered: false,
            },
            retryAfterSeconds: getEmailVerificationCooldownSeconds(),
        };
    }
}
function buildSafeUser(user) {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerifiedAt: user.emailVerifiedAt ?? null,
    };
}
function deleteStoredFiles(fileUrls) {
    const uniqueFilePaths = [...new Set(fileUrls)]
        .filter(Boolean)
        .map((fileUrl) => path.join(UPLOAD_DIR, path.basename(fileUrl)));
    for (const filePath of uniqueFilePaths) {
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }
}
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
        if (existingUser.emailVerifiedAt) {
            throw new ApiError(400, 'Email already registered');
        }
        const { emailResult, updatedUser, retryAfterSeconds } = await trySendEmailVerificationForUser(existingUser);
        res.status(200).json({
            requiresEmailVerification: true,
            message: emailResult.delivered
                ? VERIFICATION_EMAIL_SENT_MESSAGE
                : 'Your account still needs verification, but the verification email could not be sent right now.',
            user: buildSafeUser(updatedUser),
            verificationEmailSent: emailResult.delivered,
            verificationPreviewUrl: emailResult.previewUrl,
            retryAfterSeconds,
        });
        return;
    }
    // Hash password
    const hashedPassword = await hashPassword(password);
    // Create user
    const user = await prisma.user.create({
        data: {
            email: normalizedEmail,
            password: hashedPassword,
            name: name || normalizedEmail.split('@')[0],
            emailVerifiedAt: null,
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
    const { emailResult, updatedUser, retryAfterSeconds } = await trySendEmailVerificationForUser(user);
    res.status(201).json({
        requiresEmailVerification: true,
        message: emailResult.delivered
            ? VERIFICATION_EMAIL_SENT_MESSAGE
            : 'Account created, but the verification email could not be sent right now.',
        user: buildSafeUser(updatedUser),
        verificationEmailSent: emailResult.delivered,
        verificationPreviewUrl: emailResult.previewUrl,
        retryAfterSeconds,
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
    if (!user.emailVerifiedAt) {
        throw new ApiError(403, EMAIL_NOT_VERIFIED_MESSAGE, 'EMAIL_NOT_VERIFIED');
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
        user: buildSafeUser(user),
    });
});
/**
 * Verify an email address and sign the user in
 */
export const verifyEmail = asyncHandler(async (req, res) => {
    const token = typeof req.body.token === 'string' ? req.body.token.trim() : '';
    if (!token) {
        throw new ApiError(400, 'Verification token is required', 'EMAIL_VERIFICATION_INVALID');
    }
    const user = await prisma.user.findFirst({
        where: {
            emailVerificationToken: token,
            emailVerificationExpiresAt: {
                gt: new Date(),
            },
        },
    });
    if (!user) {
        throw new ApiError(400, 'Verification link is invalid or has expired. Request a new verification email.', 'EMAIL_VERIFICATION_INVALID');
    }
    const verifiedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
            emailVerifiedAt: new Date(),
            emailVerificationToken: null,
            emailVerificationExpiresAt: null,
            emailVerificationLastSentAt: null,
        },
    });
    const authToken = generateToken(verifiedUser.id);
    res.json({
        message: 'Email verified. You are now signed in.',
        token: authToken,
        user: buildSafeUser(verifiedUser),
    });
});
/**
 * Resend the verification email if the account exists and is still unverified
 */
export const resendVerificationEmail = asyncHandler(async (req, res) => {
    const normalizedEmail = req.body.email ? normalizeEmail(req.body.email) : '';
    if (!normalizedEmail) {
        throw new ApiError(400, 'Email is required');
    }
    const user = await prisma.user.findFirst({
        where: {
            email: {
                equals: normalizedEmail,
                mode: 'insensitive',
            },
        },
    });
    if (!user || user.emailVerifiedAt) {
        res.json({ message: VERIFICATION_EMAIL_GENERIC_MESSAGE });
        return;
    }
    const { emailResult, retryAfterSeconds } = await sendEmailVerificationForUser(user);
    res.json({
        message: VERIFICATION_EMAIL_GENERIC_MESSAGE,
        verificationPreviewUrl: emailResult.previewUrl,
        retryAfterSeconds,
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
            emailVerifiedAt: user.emailVerifiedAt,
            groups: user.memberships.map((m) => m.group),
            pendingInvitations: user.receivedInvitations,
        },
    });
});
/**
 * Delete the authenticated user's account
 */
export const deleteAccount = asyncHandler(async (req, res) => {
    const userId = req.userId;
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (!userId) {
        throw new ApiError(401, 'Unauthorized');
    }
    if (!password) {
        throw new ApiError(400, 'Password is required to delete your account');
    }
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });
    if (!user) {
        throw new ApiError(404, 'User not found');
    }
    const passwordIsValid = await comparePassword(password, user.password);
    if (!passwordIsValid) {
        throw new ApiError(401, 'Password is incorrect');
    }
    const groups = await prisma.group.findMany({
        where: {
            members: {
                some: {
                    userId,
                },
            },
        },
        include: {
            members: {
                select: {
                    id: true,
                    userId: true,
                    role: true,
                    joinedAt: true,
                },
                orderBy: {
                    joinedAt: 'asc',
                },
            },
        },
    });
    const groupsToDelete = new Set();
    const membershipIdsToPromote = new Set();
    for (const group of groups) {
        const currentMembership = group.members.find((member) => member.userId === userId);
        if (!currentMembership) {
            continue;
        }
        const otherMembers = group.members.filter((member) => member.userId !== userId);
        if (otherMembers.length === 0) {
            groupsToDelete.add(group.id);
            continue;
        }
        if (currentMembership.role === 'admin' && !otherMembers.some((member) => member.role === 'admin')) {
            membershipIdsToPromote.add(otherMembers[0].id);
        }
    }
    const filesToDelete = await prisma.content.findMany({
        where: {
            OR: [
                { createdById: userId },
                groupsToDelete.size > 0 ? { groupId: { in: [...groupsToDelete] } } : { id: '__never__' },
            ],
            fileUrl: {
                not: null,
            },
        },
        select: {
            fileUrl: true,
        },
    });
    const transactionSteps = [
        ...[...membershipIdsToPromote].map((membershipId) => prisma.groupMember.update({
            where: { id: membershipId },
            data: { role: 'admin' },
        })),
        ...[...groupsToDelete].map((groupId) => prisma.group.delete({
            where: { id: groupId },
        })),
        prisma.user.delete({
            where: { id: userId },
        }),
    ];
    await prisma.$transaction(transactionSteps);
    deleteStoredFiles(filesToDelete
        .map((file) => file.fileUrl)
        .filter((fileUrl) => Boolean(fileUrl)));
    res.json({ message: 'Your account has been deleted.' });
});
//# sourceMappingURL=authController.js.map