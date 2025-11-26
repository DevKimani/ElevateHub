// server/src/routes/jobRoutes.js
import express from 'express';
import { requireAuth, requireRole, optionalAuth } from '../middleware/auth.js';
import {
  jobValidation,
  jobUpdateValidation,
  workSubmissionValidation,
  workReviewValidation,
  paginationValidation,
  searchValidation,
  mongoIdValidation
} from '../middleware/validation.js';
import {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  getMyJobs,
  submitWork,
  reviewWork,
  cancelJob
} from '../controllers/jobController.js';

const router = express.Router();

// Public routes (optionalAuth provides userId if logged in)
router.get(
  '/',
  optionalAuth,
  paginationValidation,
  searchValidation,
  getJobs
);

router.get(
  '/:id',
  optionalAuth,
  mongoIdValidation,
  getJobById
);

// Protected routes - Client only
router.post(
  '/',
  requireAuth,
  requireRole(['client']),
  jobValidation,
  createJob
);

router.put(
  '/:id',
  requireAuth,
  requireRole(['client']),
  mongoIdValidation,
  jobUpdateValidation,
  updateJob
);

router.delete(
  '/:id',
  requireAuth,
  requireRole(['client']),
  mongoIdValidation,
  deleteJob
);

router.get(
  '/client/my-jobs',
  requireAuth,
  requireRole(['client']),
  paginationValidation,
  getMyJobs
);

router.post(
  '/:id/cancel',
  requireAuth,
  requireRole(['client']),
  mongoIdValidation,
  cancelJob
);

router.post(
  '/:id/review/:submissionId',
  requireAuth,
  requireRole(['client']),
  mongoIdValidation,
  workReviewValidation,
  reviewWork
);

// Protected routes - Freelancer only
router.post(
  '/:id/submit',
  requireAuth,
  requireRole(['freelancer']),
  mongoIdValidation,
  workSubmissionValidation,
  submitWork
);

export default router;