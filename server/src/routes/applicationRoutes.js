import express from 'express';
import {
  createApplication,
  getMyApplications,
  getJobApplications,
  updateApplicationStatus,
  getApplicationById,
} from '../controllers/applicationController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.post('/', requireAuth, createApplication);
router.get('/my-applications', requireAuth, getMyApplications);
router.get('/job/:jobId', requireAuth, getJobApplications);
router.put('/:id/status', requireAuth, updateApplicationStatus);
router.get('/:id', requireAuth, getApplicationById);

export default router;