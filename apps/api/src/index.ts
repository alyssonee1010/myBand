import 'dotenv/config';
import express from 'express';
import { authMiddleware, corsMiddleware } from './middleware/auth.js';
import { errorHandler } from './utils/errors.js';
import { ensureUploadDirExists, uploadDir } from './utils/uploads.js';

// Routes
import authRoutes from './routes/auth.js';
import groupRoutes from './routes/groups.js';
import contentRoutes from './routes/content.js';
import setlistRoutes from './routes/setlists.js';

const app = express();
const PORT = process.env.PORT || 3001;
const shouldExposeUploadsPublicly = process.env.EXPOSE_UPLOADS_PUBLICLY === 'true';

ensureUploadDirExists();

// ============================================================================
// Middleware
// ============================================================================

// CORS
app.use(corsMiddleware);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Optional static hosting for uploads. Keep disabled by default so file access goes
// through the authenticated file route instead of exposing uploaded files publicly.
if (shouldExposeUploadsPublicly) {
  app.use('/uploads', express.static(uploadDir));
}

// ============================================================================
// Routes
// ============================================================================

// Public routes (no auth required)
app.use('/api/auth', authRoutes);

// Protected routes (auth required)
app.use('/api/groups', authMiddleware, groupRoutes);
app.use('/api/groups/:groupId/content', authMiddleware, contentRoutes);
app.use('/api/groups/:groupId/setlists', authMiddleware, setlistRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ============================================================================
// Error Handling
// ============================================================================

app.use(errorHandler);

// ============================================================================
// Server
// ============================================================================

app.listen(PORT, () => {
  console.log(`🎸 MyBand API running on http://localhost:${PORT}`);
  console.log(`📚 API docs: See routes/* for endpoints`);
  console.log(`📁 Upload directory: ${uploadDir}`);
});
