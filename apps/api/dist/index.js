import 'dotenv/config';
import express from 'express';
import { authMiddleware, corsMiddleware } from './middleware/auth';
import { errorHandler } from './utils/errors';
// Routes
import authRoutes from './routes/auth';
import groupRoutes from './routes/groups';
import contentRoutes from './routes/content';
import setlistRoutes from './routes/setlists';
const app = express();
const PORT = process.env.PORT || 3001;
// ============================================================================
// Middleware
// ============================================================================
// CORS
app.use(corsMiddleware);
// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Static files for uploads
app.use('/uploads', express.static(process.env.UPLOAD_DIR || './uploads'));
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
});
//# sourceMappingURL=index.js.map