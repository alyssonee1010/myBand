import { Request, Response } from 'express';
/**
 * Create a new setlist
 */
export declare const createSetlist: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get all setlists for a group
 */
export declare const getGroupSetlists: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get a single setlist
 */
export declare const getSetlist: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Add content to a setlist
 */
export declare const addItemToSetlist: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Reorder items in a setlist (for drag and drop)
 */
export declare const reorderSetlistItems: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Delete a setlist
 */
export declare const deleteSetlist: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Remove item from setlist
 */
export declare const removeItemFromSetlist: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=setlistController.d.ts.map