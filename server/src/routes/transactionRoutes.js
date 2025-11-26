// server/src/routes/transactionRoutes.js
import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  transactionValidation,
  paginationValidation,
  mongoIdValidation
} from '../middleware/validation.js';
import {
  createEscrow,
  releasePayment,
  requestRefund,
  getMyTransactions,
  getTransactionById,
  addFunds
} from '../controllers/transactionController.js';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validation.js';

const router = express.Router();

// Get user's transactions
router.get(
  '/',
  requireAuth,
  paginationValidation,
  getMyTransactions
);

// Get specific transaction
router.get(
  '/:id',
  requireAuth,
  mongoIdValidation,
  getTransactionById
);

// Create escrow (Client only)
router.post(
  '/escrow',
  requireAuth,
  requireRole(['client']),
  [
    body('jobId').isMongoId().withMessage('Invalid job ID'),
    body('amount').optional().isFloat({ min: 100 }).withMessage('Amount must be at least KES 100'),
    validateRequest
  ],
  createEscrow
);

// Release payment (Client only)
router.post(
  '/release/:jobId',
  requireAuth,
  requireRole(['client']),
  releasePayment
);

// Request refund (Client only)
router.post(
  '/refund/:jobId',
  requireAuth,
  requireRole(['client']),
  [
    body('reason').trim().notEmpty().withMessage('Refund reason is required'),
    validateRequest
  ],
  requestRefund
);

// Add funds (for testing/demo purposes)
router.post(
  '/add-funds',
  requireAuth,
  [
    body('amount').isFloat({ min: 100 }).withMessage('Amount must be at least KES 100'),
    validateRequest
  ],
  addFunds
);

export default router;