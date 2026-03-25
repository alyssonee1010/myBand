import { Request, Response } from 'express';
/**
 * Register a new user
 */
export declare const register: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Login a user
 */
export declare const login: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Verify an email address and sign the user in
 */
export declare const verifyEmail: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Resend the verification email if the account exists and is still unverified
 */
export declare const resendVerificationEmail: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get current user profile
 */
export declare const getProfile: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Delete the authenticated user's account
 */
export declare const deleteAccount: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=authController.d.ts.map