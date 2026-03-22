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
 * Add a user to a group via email
 */
export declare const addMemberToGroup: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=groupController.d.ts.map