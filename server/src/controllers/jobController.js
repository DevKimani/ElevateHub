// server/src/controllers/jobController.js
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Create a new job
// @route   POST /api/jobs
// @access  Private (Client only)
export const createJob = asyncHandler(async (req, res) => {
  const { title, description, budget, category, deadline, skills, tags, experienceLevel } = req.body;
  
  // Get user from database using clerkId
  const user = await User.findOne({ clerkId: req.userId });
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found. Please complete your profile.'
    });
  }

  if (user.role !== 'client') {
    return res.status(403).json({
      success: false,
      message: 'Only clients can post jobs'
    });
  }

  // Create the job with the user's MongoDB _id
  const job = await Job.create({
    title,
    description,
    budget,
    category,
    deadline,
    skills: skills || [],
    tags: tags || [],
    experienceLevel: experienceLevel || 'any',
    client: user._id  // ✅ CRITICAL: Use user._id (MongoDB ObjectId), not req.userId (Clerk ID)
  });

  // Populate the client data for the response
  await job.populate('client', 'firstName lastName profilePicture email');

  res.status(201).json({
    success: true,
    message: 'Job created successfully',
    job
  });
});

// @desc    Get all jobs with pagination and filters
// @route   GET /api/jobs
// @access  Public
export const getJobs = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const { 
    category, 
    minBudget, 
    maxBudget, 
    search, 
    status = 'open',
    experienceLevel,
    sortBy = 'createdAt',
    order = 'desc'
  } = req.query;

  // Build query
  const query = { isActive: true };
  
  if (status && status !== 'all') {
    query.status = status;
  }

  if (category && category !== 'all') {
    query.category = category;
  }

  if (experienceLevel && experienceLevel !== 'all') {
    query.experienceLevel = experienceLevel;
  }

  if (minBudget || maxBudget) {
    query.budget = {};
    if (minBudget) query.budget.$gte = Number(minBudget);
    if (maxBudget) query.budget.$lte = Number(maxBudget);
  }

  if (search) {
    query.$text = { $search: search };
  }

  // Build sort object
  const sortOrder = order === 'asc' ? 1 : -1;
  const sort = {};
  
  if (search) {
    sort.score = { $meta: 'textScore' };
  } else {
    sort[sortBy] = sortOrder;
  }

  // Execute query
  const [jobs, total] = await Promise.all([
    Job.find(query)
      .populate('client', 'firstName lastName profilePicture location')
      .populate('acceptedFreelancer', 'firstName lastName profilePicture')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Job.countDocuments(query)
  ]);

  res.json({
    success: true,
    jobs,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  });
});

// @desc    Get a single job by ID
// @route   GET /api/jobs/:id
// @access  Public
export const getJobById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid job ID'
    });
  }

  const job = await Job.findById(id)
    .populate('client', 'firstName lastName profilePicture email location bio')
    .populate('acceptedFreelancer', 'firstName lastName profilePicture skills hourlyRate')
    .populate('submissions.submittedBy', 'firstName lastName profilePicture')
    .populate('submissions.reviewedBy', 'firstName lastName');

  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found'
    });
  }

  // Increment view count (async, don't wait)
  job.incrementViews().catch(err => console.error('Error incrementing views:', err));

  res.json({
    success: true,
    job
  });
});

// @desc    Update a job
// @route   PUT /api/jobs/:id
// @access  Private (Job owner only)
export const updateJob = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const job = await Job.findById(id);

  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found'
    });
  }

  // Check ownership
  const user = await User.findOne({ clerkId: req.userId });
  if (!job.client.equals(user._id)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this job'
    });
  }

  // Prevent updating certain fields after job is in progress
  if (job.status !== 'open') {
    const restrictedFields = ['budget', 'category'];
    const hasRestrictedUpdates = restrictedFields.some(field => field in updates);
    
    if (hasRestrictedUpdates) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update budget or category after job has started'
      });
    }
  }

  // Apply updates
  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined) {
      job[key] = updates[key];
    }
  });

  await job.save();
  await job.populate('client', 'firstName lastName profilePicture');

  res.json({
    success: true,
    message: 'Job updated successfully',
    job
  });
});

// @desc    Delete a job
// @route   DELETE /api/jobs/:id
// @access  Private (Job owner only)
export const deleteJob = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const job = await Job.findById(id);

  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found'
    });
  }

  // Check ownership
  const user = await User.findOne({ clerkId: req.userId });
  if (!job.client.equals(user._id)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to delete this job'
    });
  }

  // Don't allow deletion if job is in progress or has escrow
  if (job.status === 'in_progress' || job.escrowCreated) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete job that is in progress or has escrow funds'
    });
  }

  // Soft delete by marking inactive
  job.isActive = false;
  job.status = 'cancelled';
  await job.save();

  res.json({
    success: true,
    message: 'Job deleted successfully'
  });
});

// @desc    Get jobs posted by client
// @route   GET /api/jobs/my-jobs
// @access  Private (Client only)
export const getMyJobs = asyncHandler(async (req, res) => {
  const user = await User.findOne({ clerkId: req.userId });

  if (!user || user.role !== 'client') {
    return res.status(403).json({
      success: false,
      message: 'Only clients can view their jobs'
    });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;
  const { status } = req.query;

  const query = { client: user._id };
  if (status && status !== 'all') {
    query.status = status;
  }

  const [jobs, total] = await Promise.all([
    Job.find(query)
      .populate('acceptedFreelancer', 'firstName lastName profilePicture')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Job.countDocuments(query)
  ]);

  // Get application counts for each job
  const jobIds = jobs.map(job => job._id);
  const applicationCounts = await Application.aggregate([
    { $match: { job: { $in: jobIds } } },
    { $group: { _id: '$job', count: { $sum: 1 } } }
  ]);

  const countMap = applicationCounts.reduce((acc, curr) => {
    acc[curr._id] = curr.count;
    return acc;
  }, {});

  const jobsWithCounts = jobs.map(job => ({
    ...job,
    applicationsCount: countMap[job._id] || 0
  }));

  res.json({
    success: true,
    jobs: jobsWithCounts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Submit work for a job
// @route   POST /api/jobs/:id/submit
// @access  Private (Accepted freelancer only)
export const submitWork = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { description, attachments } = req.body;

  const job = await Job.findById(id);

  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found'
    });
  }

  const user = await User.findOne({ clerkId: req.userId });

  // Check if user is the accepted freelancer
  if (!job.acceptedFreelancer || !job.acceptedFreelancer.equals(user._id)) {
    return res.status(403).json({
      success: false,
      message: 'Only the accepted freelancer can submit work'
    });
  }

  const submission = await job.addSubmission({
    submittedBy: user._id,
    description,
    attachments: attachments || []
  });

  await job.populate('acceptedFreelancer', 'firstName lastName profilePicture');

  // Emit socket event to client
  const io = req.app.get('io');
  io.to(job.client.toString()).emit('work-submitted', {
    jobId: job._id,
    jobTitle: job.title,
    freelancer: user.firstName + ' ' + user.lastName
  });

  res.status(201).json({
    success: true,
    message: 'Work submitted successfully',
    submission,
    job
  });
});

// @desc    Review work submission
// @route   POST /api/jobs/:id/review/:submissionId
// @access  Private (Client only)
export const reviewWork = asyncHandler(async (req, res) => {
  const { id, submissionId } = req.params;
  const { status, reviewNotes } = req.body;

  const job = await Job.findById(id);

  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found'
    });
  }

  const user = await User.findOne({ clerkId: req.userId });

  // Check if user is the job client
  if (!job.client.equals(user._id)) {
    return res.status(403).json({
      success: false,
      message: 'Only the client can review work'
    });
  }

  const submission = await job.reviewSubmission(
    submissionId,
    status,
    reviewNotes,
    user._id
  );

  await job.populate('acceptedFreelancer', 'firstName lastName profilePicture');

  // Emit socket event to freelancer
  const io = req.app.get('io');
  io.to(job.acceptedFreelancer._id.toString()).emit('work-reviewed', {
    jobId: job._id,
    jobTitle: job.title,
    status,
    reviewNotes
  });

  res.json({
    success: true,
    message: `Work ${status === 'approved' ? 'approved' : 'revision requested'}`,
    submission,
    job
  });
});

// @desc    Cancel a job
// @route   POST /api/jobs/:id/cancel
// @access  Private (Client only)
export const cancelJob = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const job = await Job.findById(id);

  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found'
    });
  }

  const user = await User.findOne({ clerkId: req.userId });

  if (!job.client.equals(user._id)) {
    return res.status(403).json({
      success: false,
      message: 'Only the job owner can cancel this job'
    });
  }

  await job.cancel(reason);

  res.json({
    success: true,
    message: 'Job cancelled successfully',
    job
  });
});

export default {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  getMyJobs,
  submitWork,
  reviewWork,
  cancelJob
};