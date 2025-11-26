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

// Alias for backward compatibility
export const getJobs = getAllJobs;

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
// @route   POST /api/jobs/:id/cancel
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
// @route   GET /api/jobs/client/my-jobs
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

// @desc    Submit work for a job
// @route   POST /api/jobs/:id/submit
// @access  Private (Freelancer only)
export const submitWork = async (req, res) => {
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

    // Check if job is in progress and assigned to this freelancer
    if (job.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Job must be in progress to submit work',
      });
    }

    if (job.acceptedFreelancer && job.acceptedFreelancer.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not assigned to this job',
      });
    }

    const { description, attachments } = req.body;

    // Create work submission
    const submission = {
      freelancer: user._id,
      description,
      attachments: attachments || [],
      submittedAt: new Date(),
      status: 'pending'
    };

    // Add submission to job
    if (!job.submissions) {
      job.submissions = [];
    }
    job.submissions.push(submission);
    
    // Update job status to under_review
    job.status = 'under_review';
    await job.save();

    await job.populate('postedBy', 'firstName lastName profileImage location');
    await job.populate('acceptedFreelancer', 'firstName lastName profileImage');

    res.status(200).json({
      success: true,
      data: job,
      message: 'Work submitted successfully',
    });
  } catch (error) {
    console.error('Submit work error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting work',
      error: error.message,
    });
  }
};

// @desc    Review submitted work
// @route   POST /api/jobs/:id/review/:submissionId
// @access  Private (Client only)
export const reviewWork = async (req, res) => {
  try {
    const { id: jobId, submissionId } = req.params;
    const { approved, feedback, rating } = req.body;

    const job = await Job.findById(jobId);

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

    // Check if user is the job owner
    if (job.postedBy.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to review this submission',
      });
    }

    // Find the submission
    const submission = job.submissions?.id(submissionId);

    if (!submission) {
      return res.status(404).json({
        success: false,
        message: 'Submission not found',
      });
    }

    // Update submission
    submission.status = approved ? 'approved' : 'rejected';
    submission.feedback = feedback;
    submission.reviewedAt = new Date();

    // Update job status
    if (approved) {
      job.status = 'completed';
      job.completedAt = new Date();
      
      // Update freelancer rating if provided
      if (rating && job.acceptedFreelancer) {
        const freelancer = await User.findById(job.acceptedFreelancer);
        if (freelancer) {
          // Update freelancer's average rating
          const currentRatings = freelancer.totalRatings || 0;
          const currentAverage = freelancer.rating || 0;
          const newTotal = currentRatings + 1;
          const newAverage = ((currentAverage * currentRatings) + rating) / newTotal;
          
          freelancer.rating = newAverage;
          freelancer.totalRatings = newTotal;
          await freelancer.save();
        }
      }
    } else {
      job.status = 'in_progress'; // Send back to in progress for revision
    }

    await job.save();

    await job.populate('postedBy', 'firstName lastName profileImage location');
    await job.populate('acceptedFreelancer', 'firstName lastName profileImage');

    res.status(200).json({
      success: true,
      data: job,
      message: approved ? 'Work approved successfully' : 'Work rejected, freelancer can resubmit',
    });
  } catch (error) {
    console.error('Review work error:', error);
    res.status(500).json({
      success: false,
      message: 'Error reviewing work',
      error: error.message,
    });
  }
};