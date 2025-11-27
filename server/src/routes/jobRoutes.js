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

// ============================================
// CRITICAL: SPECIFIC ROUTES MUST COME FIRST!
// ============================================

// Public route - Get all jobs (with pagination/filters)
router.get(
  '/',
  optionalAuth,
  paginationValidation,
  searchValidation,
  getJobs
);

// ✅ SPECIFIC ROUTES - Must come BEFORE /:id
// Protected route - Get client's own jobs
router.get(
  '/my-jobs',
  requireAuth,
  requireRole(['client']),
  paginationValidation,
  getMyJobs
);

// Alternative route for compatibility
router.get(
  '/user/my-jobs',
  requireAuth,
  requireRole(['client']),
  paginationValidation,
  getMyJobs
);

// ✅ PARAMETERIZED ROUTES - Must come AFTER specific routes
// Public route - Get single job by ID
router.get(
  '/:id',
  optionalAuth,
  mongoIdValidation,
  getJobById
);

// ============================================
// POST/PUT/DELETE ROUTES
// ============================================

// Protected route - Create new job (Client only)
router.post(
  '/',
  requireAuth,
  requireRole(['client']),
  jobValidation,
  createJob
);

// Protected route - Update job (Client only)
router.put(
  '/:id',
  requireAuth,
  requireRole(['client']),
  mongoIdValidation,
  jobUpdateValidation,
  updateJob
);

// Protected route - Delete job (Client only)
router.delete(
  '/:id',
  requireAuth,
  requireRole(['client']),
  mongoIdValidation,
  deleteJob
);

// Protected route - Cancel job (Client only)
router.post(
  '/:id/cancel',
  requireAuth,
  requireRole(['client']),
  mongoIdValidation,
  cancelJob
);

// Protected route - Submit work (Freelancer only)
router.post(
  '/:id/submit',
  requireAuth,
  requireRole(['freelancer']),
  mongoIdValidation,
  workSubmissionValidation,
  submitWork
);

// Protected route - Review work submission (Client only)
router.post(
  '/:id/review/:submissionId',
  requireAuth,
  requireRole(['client']),
  mongoIdValidation,
  workReviewValidation,
  reviewWork
);

export default router;