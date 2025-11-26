// server/src/controllers/applicationController.js
import Application from '../models/Application.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Create a new application
// @route   POST /api/applications
// @access  Private (Freelancer only)
export const createApplication = asyncHandler(async (req, res) => {
  const { job, coverLetter, proposedBudget, estimatedDuration } = req.body;

  const user = await User.findOne({ clerkId: req.userId });

  if (!user || user.role !== 'freelancer') {
    return res.status(403).json({
      success: false,
      message: 'Only freelancers can apply to jobs'
    });
  }

  // Check if job exists and is open
  const jobDoc = await Job.findById(job);

  if (!jobDoc) {
    return res.status(404).json({
      success: false,
      message: 'Job not found'
    });
  }

  if (jobDoc.status !== 'open') {
    return res.status(400).json({
      success: false,
      message: 'This job is no longer accepting applications'
    });
  }

  // Check if user already applied
  const existingApplication = await Application.findOne({
    job: job,
    freelancer: user._id
  });

  if (existingApplication) {
    return res.status(400).json({
      success: false,
      message: 'You have already applied to this job'
    });
  }

  // Create application
  const application = await Application.create({
    job,
    freelancer: user._id,
    coverLetter,
    proposedBudget,
    estimatedDuration: estimatedDuration || null
  });

  await application.populate([
    { path: 'freelancer', select: 'firstName lastName profilePicture skills hourlyRate' },
    { path: 'job', select: 'title budget category client' }
  ]);

  // Update job applications count
  jobDoc.applicationsCount = (jobDoc.applicationsCount || 0) + 1;
  await jobDoc.save();

  res.status(201).json({
    success: true,
    message: 'Application submitted successfully',
    application
  });
});

// @desc    Get applications for a specific job
// @route   GET /api/applications/job/:jobId
// @access  Private (Job owner only)
export const getJobApplications = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const user = await User.findOne({ clerkId: req.userId });

  // Verify job exists and user is the owner
  const job = await Job.findById(jobId);

  if (!job) {
    return res.status(404).json({
      success: false,
      message: 'Job not found'
    });
  }

  if (!job.client.equals(user._id)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view these applications'
    });
  }

  const { status } = req.query;
  const query = { job: jobId };

  if (status && status !== 'all') {
    query.status = status;
  }

  const [applications, total] = await Promise.all([
    Application.find(query)
      .populate('freelancer', 'firstName lastName profilePicture skills hourlyRate bio location')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Application.countDocuments(query)
  ]);

  res.json({
    success: true,
    applications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get freelancer's applications
// @route   GET /api/applications/my-applications
// @access  Private (Freelancer only)
export const getMyApplications = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const user = await User.findOne({ clerkId: req.userId });

  if (!user || user.role !== 'freelancer') {
    return res.status(403).json({
      success: false,
      message: 'Only freelancers can view their applications'
    });
  }

  const { status } = req.query;
  const query = { freelancer: user._id };

  if (status && status !== 'all') {
    query.status = status;
  }

  const [applications, total] = await Promise.all([
    Application.find(query)
      .populate({
        path: 'job',
        select: 'title budget category deadline status client',
        populate: {
          path: 'client',
          select: 'firstName lastName profilePicture'
        }
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Application.countDocuments(query)
  ]);

  res.json({
    success: true,
    applications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Update application status (accept/reject)
// @route   PATCH /api/applications/:id/status
// @access  Private (Job owner only)
export const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, rejectionReason } = req.body;

  const user = await User.findOne({ clerkId: req.userId });

  const application = await Application.findById(id).populate('job');

  if (!application) {
    return res.status(404).json({
      success: false,
      message: 'Application not found'
    });
  }

  // Verify user is the job owner
  if (!application.job.client.equals(user._id)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to update this application'
    });
  }

  // Can't change status if job is not open
  if (application.job.status !== 'open') {
    return res.status(400).json({
      success: false,
      message: 'Cannot update applications for jobs that are not open'
    });
  }

  // Update application
  await application.updateStatus(status, user._id, rejectionReason);

  // If accepted, update job
  if (status === 'accepted') {
    application.job.acceptedFreelancer = application.freelancer;
    application.job.status = 'in_progress';
    application.job.startedAt = new Date();
    await application.job.save();

    // Reject other applications
    await Application.updateMany(
      {
        job: application.job._id,
        _id: { $ne: application._id },
        status: 'pending'
      },
      {
        status: 'rejected',
        $push: {
          statusHistory: {
            status: 'rejected',
            changedAt: new Date(),
            changedBy: user._id,
            reason: 'Another freelancer was accepted for this job'
          }
        }
      }
    );
  }

  await application.populate([
    { path: 'freelancer', select: 'firstName lastName profilePicture' },
    { path: 'job', select: 'title budget category' }
  ]);

  res.json({
    success: true,
    message: `Application ${status}`,
    application
  });
});

// @desc    Withdraw application
// @route   DELETE /api/applications/:id
// @access  Private (Application owner only)
export const withdrawApplication = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findOne({ clerkId: req.userId });

  const application = await Application.findById(id);

  if (!application) {
    return res.status(404).json({
      success: false,
      message: 'Application not found'
    });
  }

  // Verify user is the application owner
  if (!application.freelancer.equals(user._id)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to withdraw this application'
    });
  }

  // Can't withdraw if already accepted or rejected
  if (application.status !== 'pending') {
    return res.status(400).json({
      success: false,
      message: `Cannot withdraw application with status: ${application.status}`
    });
  }

  application.status = 'withdrawn';
  application.withdrawnAt = new Date();
  await application.save();

  res.json({
    success: true,
    message: 'Application withdrawn successfully'
  });
});

// @desc    Get single application
// @route   GET /api/applications/:id
// @access  Private (Application owner or job owner)
export const getApplicationById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findOne({ clerkId: req.userId });

  const application = await Application.findById(id)
    .populate('freelancer', 'firstName lastName profilePicture skills hourlyRate bio location')
    .populate({
      path: 'job',
      select: 'title description budget category deadline status client',
      populate: {
        path: 'client',
        select: 'firstName lastName profilePicture'
      }
    });

  if (!application) {
    return res.status(404).json({
      success: false,
      message: 'Application not found'
    });
  }

  // Verify user is either the freelancer or job owner
  const isFreelancer = application.freelancer._id.equals(user._id);
  const isJobOwner = application.job.client._id.equals(user._id);

  if (!isFreelancer && !isJobOwner) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this application'
    });
  }

  res.json({
    success: true,
    application
  });
});

export default {
  createApplication,
  getJobApplications,
  getMyApplications,
  updateApplicationStatus,
  withdrawApplication,
  getApplicationById
};