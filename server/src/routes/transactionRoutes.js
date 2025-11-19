import express from 'express';
import {
  createEscrow,
  releaseEscrow,
  requestRefund,
  getTransactionById,
  getMyTransactions,
  getJobTransaction,
} from '../controllers/transactionController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.post('/escrow', requireAuth, createEscrow);
router.get('/my-transactions', requireAuth, getMyTransactions);
router.get('/job/:jobId', requireAuth, getJobTransaction);
router.get('/:id', requireAuth, getTransactionById);
router.post('/:id/release', requireAuth, releaseEscrow);
router.post('/:id/refund', requireAuth, requestRefund);

export default router;