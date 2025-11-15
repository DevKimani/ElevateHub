import Application from '../models/Application.js';
import Job from '../models/Job.js';
import User from '../models/User.js';

// @desc    Create application (Apply to job)
// @route   POST /api/applications
// @access  Private (Freelancers only)
export const createApplication = async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user is a freelancer
    if (user.role !== 'freelancer') {
      return res.status(403).json({
        success: false,
        message: 'Only freelancers can apply to jobs',
      });
    }

    const { jobId, coverLetter, proposedRate, proposedDeadline } = req.body;

    // Validate required fields
    if (!jobId || !coverLetter || !proposedRate || !proposedDeadline) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields',
      });
    }

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Check if job is still open
    if (job.status !== 'open') {
      return res.status(400).json({
        success: false,
        message: 'This job is no longer accepting applications',
      });
    }

    // Check if user already applied
    const existingApplication = await Application.findOne({
      job: jobId,
      freelancer: user._id,
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this job',
      });
    }

    // Create application
    const application = await Application.create({
      job: jobId,
      freelancer: user._id,
      coverLetter,
      proposedRate,
      proposedDeadline,
    });

    // Update job applications count
    await Job.findByIdAndUpdate(jobId, {
      $inc: { applicationsCount: 1 },
    });

    // Populate fields
    await application.populate('freelancer', 'firstName lastName email profileImage skills hourlyRate location');
    await application.populate('job', 'title budget budgetType');

    res.status(201).json({
      success: true,
      data: application,
      message: 'Application submitted successfully',
    });
  } catch (error) {
    console.error('Create application error:', error);
    
    // Handle duplicate application error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this job',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error submitting application',
      error: error.message,
    });
  }
};

// @desc    Get freelancer's applications
// @route   GET /api/applications/my-applications
// @access  Private (Freelancers only)
export const getMyApplications = async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const applications = await Application.find({ freelancer: user._id })
      .populate('job', 'title category budget budgetType deadline status postedBy')
      .populate({
        path: 'job',
        populate: {
          path: 'postedBy',
          select: 'firstName lastName profileImage location',
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: applications,
    });
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications',
      error: error.message,
    });
  }
};

// @desc    Get applications for a job
// @route   GET /api/applications/job/:jobId
// @access  Private (Job owner only)
export const getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Get current user
    const user = await User.findOne({ clerkId: req.userId });

    // Check if user is the job owner
    if (job.postedBy.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view applications for this job',
      });
    }

    const applications = await Application.find({ job: jobId })
      .populate('freelancer', 'firstName lastName email profileImage skills hourlyRate location bio')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: applications,
    });
  } catch (error) {
    console.error('Get job applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications',
      error: error.message,
    });
  }
};

// @desc    Update application status (Accept/Reject)
// @route   PUT /api/applications/:id/status
// @access  Private (Job owner only)
export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be either "accepted" or "rejected"',
      });
    }

    // Find application
    const application = await Application.findById(id).populate('job');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Get current user
    const user = await User.findOne({ clerkId: req.userId });

    // Check if user is the job owner
    if (application.job.postedBy.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this application',
      });
    }

    // Update application status
    application.status = status;
    await application.save();

    // If accepted, update job status and assign freelancer
    if (status === 'accepted') {
      await Job.findByIdAndUpdate(application.job._id, {
        status: 'in_progress',
        acceptedFreelancer: application.freelancer,
      });

      // Reject all other pending applications for this job
      await Application.updateMany(
        {
          job: application.job._id,
          _id: { $ne: application._id },
          status: 'pending',
        },
        { status: 'rejected' }
      );
    }

    await application.populate('freelancer', 'firstName lastName email profileImage skills hourlyRate');
    await application.populate('job', 'title budget budgetType');

    res.status(200).json({
      success: true,
      data: application,
      message: `Application ${status} successfully`,
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating application status',
      error: error.message,
    });
  }
};

// @desc    Get single application by ID
// @route   GET /api/applications/:id
// @access  Private
export const getApplicationById = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('freelancer', 'firstName lastName email profileImage skills hourlyRate location bio')
      .populate('job', 'title description category budget budgetType deadline status postedBy')
      .populate({
        path: 'job',
        populate: {
          path: 'postedBy',
          select: 'firstName lastName email profileImage location',
        },
      });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Get current user
    const user = await User.findOne({ clerkId: req.userId });

    // Check authorization (must be either the freelancer or job owner)
    const isFreelancer = application.freelancer._id.toString() === user._id.toString();
    const isJobOwner = application.job.postedBy._id.toString() === user._id.toString();

    if (!isFreelancer && !isJobOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this application',
      });
    }

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error('Get application by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching application',
      error: error.message,
    });
  }
};