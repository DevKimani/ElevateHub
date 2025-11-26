// server/src/routes/applicationRoutes.js
import express from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  applicationValidation,
  applicationStatusValidation,
  paginationValidation,
  mongoIdValidation
} from '../middleware/validation.js';
import {
  createApplication,
  getJobApplications,
  getMyApplications,
  updateApplicationStatus,
  withdrawApplication,
  getApplicationById
} from '../controllers/applicationController.js';

const router = express.Router();

// Create application (Freelancer only)
router.post(
  '/',
  requireAuth,
  requireRole(['freelancer']),
  applicationValidation,
  createApplication
);

// Get freelancer's applications
router.get(
  '/my-applications',
  requireAuth,
  requireRole(['freelancer']),
  paginationValidation,
  getMyApplications
);

// Get applications for a job (Client only)
router.get(
  '/job/:jobId',
  requireAuth,
  requireRole(['client']),
  mongoIdValidation,
  paginationValidation,
  getJobApplications
);

// Get single application
router.get(
  '/:id',
  requireAuth,
  mongoIdValidation,
  getApplicationById
);

// Update application status (Client only)
router.patch(
  '/:id/status',
  requireAuth,
  requireRole(['client']),
  mongoIdValidation,
  applicationStatusValidation,
  updateApplicationStatus
);

// Withdraw application (Freelancer only)
router.delete(
  '/:id',
  requireAuth,
  requireRole(['freelancer']),
  mongoIdValidation,
  withdrawApplication
);

export default router;