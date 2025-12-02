// server/src/routes/adminRoutes.js
import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  getPlatformStats,
  getAllUsers,
  getUserById,
  suspendUser,
  unsuspendUser,
  deleteUser,
  getAnalytics
} from '../controllers/adminController.js';

const router = express.Router();

// All routes require admin role
router.use(requireAuth);
router.use(requireRole(['admin']));

// Platform statistics
router.get('/stats', getPlatformStats);

// Analytics
router.get('/analytics', getAnalytics);

// User management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.post('/users/:id/suspend', suspendUser);
router.post('/users/:id/unsuspend', unsuspendUser);
router.delete('/users/:id', deleteUser);

export default router;