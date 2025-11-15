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
router.get('/:id', getJobById);

// Protected routes
router.post('/', requireAuth, createJob);
router.put('/:id', requireAuth, updateJob);
router.delete('/:id', requireAuth, deleteJob);
router.get('/user/my-jobs', requireAuth, getMyJobs);

export default router;