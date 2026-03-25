import { Router } from 'express';
import {
  uploadContent,
  addTextContent,
  getGroupContent,
  getContentFile,
  deleteContent,
} from '../controllers/contentController.js';
import { asyncHandler } from '../utils/errors.js';
import { authMiddleware } from '../middleware/auth.js';
import { ensureUploadDirExists } from '../utils/uploads.js';
import multer from 'multer';

const router = Router({ mergeParams: true }); // Allow inherited params like groupId
const uploadDir = ensureUploadDirExists();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Configure multer for file uploads
const upload = multer({
  dest: uploadDir,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Only allow PDFs and images
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDFs and images are allowed'));
    }
  },
});

/**
 * @route POST /api/groups/:groupId/content/upload
 * @desc Upload a file (PDF or image)
 * @body FormData { file, title, description? }
 */
router.post('/upload', upload.single('file'), asyncHandler(uploadContent));

/**
 * @route POST /api/groups/:groupId/content/text
 * @desc Add text content (lyrics or chords)
 * @body { title, textContent, contentType, description? }
 */
router.post('/text', asyncHandler(addTextContent));

/**
 * @route GET /api/groups/:groupId/content
 * @desc Get all content in a group
 */
router.get('/', asyncHandler(getGroupContent));

/**
 * @route GET /api/groups/:groupId/content/:contentId/file
 * @desc Stream a file for inline viewing
 */
router.get('/:contentId/file', asyncHandler(getContentFile));

/**
 * @route DELETE /api/groups/:groupId/content/:contentId
 * @desc Delete content
 */
router.delete('/:contentId', asyncHandler(deleteContent));

export default router;
