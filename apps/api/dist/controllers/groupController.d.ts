import { Request, Response } from 'express';
/**
 * Create a new group (band)
 */
export declare const createGroup: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get all groups for current user
 */
export declare const getUserGroups: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get a single group by ID
 */
export declare const getGroup: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Invite a user to a group via email
 */
export declare const inviteMemberToGroup: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Revoke a pending invitation so it no longer appears or can be accepted
 */
export declare const revokeGroupInvitation: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Accept a pending invitation and join the group
 */
export declare const acceptGroupInvitation: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=groupController.d.ts.map