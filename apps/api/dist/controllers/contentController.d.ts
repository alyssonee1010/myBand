import { Request, Response } from 'express';
/**
 * Upload a file (PDF or image)
 */
export declare const uploadContent: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Add text content (lyrics or chords)
 */
export declare const addTextContent: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Get all content in a group
 */
export declare const getGroupContent: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Stream a stored file with inline headers for in-app viewing
 */
export declare const getContentFile: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Update the visible metadata of an existing content item
 */
export declare const updateContent: (req: Request, res: Response, next: import("express").NextFunction) => void;
/**
 * Delete content
 */
export declare const deleteContent: (req: Request, res: Response, next: import("express").NextFunction) => void;
//# sourceMappingURL=contentController.d.ts.map