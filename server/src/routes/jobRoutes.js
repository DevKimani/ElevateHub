import express from 'express';
import {
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  getMyJobs,
} from '../controllers/jobController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllJobs);

// Protected routes - must come before /:id
router.post('/', requireAuth, createJob);
router.get('/user/my-jobs', requireAuth, getMyJobs);

// Dynamic routes - must come last
router.get('/:id', getJobById);
router.put('/:id', requireAuth, updateJob);
router.delete('/:id', requireAuth, deleteJob);

export default router;