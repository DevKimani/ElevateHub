import express from 'express';
import {
  getConversations,
  getMessages,
  sendMessage,
  markAsRead,
} from '../controllers/messageController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.get('/conversations', requireAuth, getConversations);
router.get('/conversation/:jobId/:otherUserId', requireAuth, getMessages);
router.post('/', requireAuth, sendMessage);
router.put('/read/:conversationId', requireAuth, markAsRead);

export default router;