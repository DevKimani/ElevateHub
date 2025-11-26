import Job from '../models/Job.js';
import User from '../models/User.js';

// @desc    Get all jobs (with filters)
// @route   GET /api/jobs
// @access  Public
export const getAllJobs = async (req, res) => {
  try {
    const {
      category,
      budgetMin,
      budgetMax,
      search,
      page = 1,
      limit = 10,
      status = 'open',
    } = req.query;

    // Build query
    const query = { status };

    // Category filter
    if (category) {
      query.category = category;
    }

    // Budget filter
    if (budgetMin || budgetMax) {
      query.budget = {};
      if (budgetMin) query.budget.$gte = Number(budgetMin);
      if (budgetMax) query.budget.$lte = Number(budgetMax);
    }

    // Search filter (title and description)
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);

    // Execute query
    const jobs = await Job.find(query)
      .populate('postedBy', 'firstName lastName profileImage location')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Get total count for pagination
    const total = await Job.countDocuments(query);

    res.status(200).json({
      success: true,
      data: jobs,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get all jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching jobs',
      error: error.message,
    });
  }
};

// @desc    Get single job by ID
// @route   GET /api/jobs/:id
// @access  Public
export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'firstName lastName email profileImage location bio')
      .populate('acceptedFreelancer', 'firstName lastName profileImage');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error('Get job by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching job',
      error: error.message,
    });
  }
};

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private (Clients only)
export const createJob = async (req, res) => {
  try {
    // Get user
    const user = await User.findOne({ clerkId: req.userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user is a client
    if (user.role !== 'client') {
      return res.status(403).json({
        success: false,
        message: 'Only clients can post jobs',
      });
    }

    const {
      title,
      description,
      category,
      budget,
      budgetType,
      deadline,
      skills,
    } = req.body;

    // Validate required fields
    if (!title || !description || !category || !budget || !deadline) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Create job
    const job = await Job.create({
      title,
      description,
      category,
      budget,
      budgetType: budgetType || 'fixed',
      deadline,
      skills: skills || [],
      postedBy: user._id,
    });

    // Populate postedBy field
    await job.populate('postedBy', 'firstName lastName profileImage location');

    res.status(201).json({
      success: true,
      data: job,
      message: 'Job posted successfully',
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating job',
      error: error.message,
    });
  }
};

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private (Owner only)
export const updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Get user
    const user = await User.findOne({ clerkId: req.userId });

    // Check if user is the owner
    if (job.postedBy.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this job',
      });
    }

    const {
      title,
      description,
      category,
      budget,
      budgetType,
      deadline,
      skills,
      status,
    } = req.body;

    // Update fields
    if (title) job.title = title;
    if (description) job.description = description;
    if (category) job.category = category;
    if (budget) job.budget = budget;
    if (budgetType) job.budgetType = budgetType;
    if (deadline) job.deadline = deadline;
    if (skills) job.skills = skills;
    if (status) job.status = status;

    await job.save();
    await job.populate('postedBy', 'firstName lastName profileImage location');

    res.status(200).json({
      success: true,
      data: job,
      message: 'Job updated successfully',
    });
  } catch (error) {
    console.error('Update job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating job',
      error: error.message,
    });
  }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private (Owner only)
export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Get user
    const user = await User.findOne({ clerkId: req.userId });

    // Check if user is the owner
    if (job.postedBy.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this job',
      });
    }

    await job.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Job deleted successfully',
    });
  } catch (error) {
    console.error('Delete job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting job',
      error: error.message,
    });
  }
};

// @desc    Cancel job
// @route   PUT /api/jobs/:id/cancel
// @access  Private (Owner only)
export const cancelJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Get user
    const user = await User.findOne({ clerkId: req.userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user is the owner
    if (job.postedBy.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this job',
      });
    }

    // Can only cancel jobs that are open or in_progress
    if (!['open', 'in_progress'].includes(job.status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel job with status: ${job.status}`,
      });
    }

    // Update job status to cancelled
    job.status = 'cancelled';
    await job.save();

    await job.populate('postedBy', 'firstName lastName profileImage location');

    res.status(200).json({
      success: true,
      data: job,
      message: 'Job cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel job error:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling job',
      error: error.message,
    });
  }
};

// @desc    Get current user's jobs
// @route   GET /api/jobs/my-jobs
// @access  Private
export const getMyJobs = async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const jobs = await Job.find({ postedBy: user._id })
      .sort({ createdAt: -1 })
      .populate('acceptedFreelancer', 'firstName lastName profileImage');

    res.status(200).json({
      success: true,
      data: jobs,
    });
  } catch (error) {
    console.error('Get my jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching jobs',
      error: error.message,
    });
  }
};