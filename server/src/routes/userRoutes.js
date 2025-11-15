import express from 'express';
import {
  getCurrentUser,
  updateCurrentUser,
  getUserById,
} from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Protected routes
router.get('/me', requireAuth, getCurrentUser);
router.put('/me', requireAuth, updateCurrentUser);

// Public routes
router.get('/:id', getUserById);

export default router;
