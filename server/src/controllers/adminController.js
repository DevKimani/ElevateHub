// server/src/controllers/adminController.js
import User from '../models/User.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import Transaction from '../models/Transaction.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Get platform statistics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
export const getPlatformStats = asyncHandler(async (req, res) => {
  // User stats
  const totalUsers = await User.countDocuments({ isActive: true });
  const totalClients = await User.countDocuments({ role: 'client', isActive: true });
  const totalFreelancers = await User.countDocuments({ role: 'freelancer', isActive: true });
  const totalAdmins = await User.countDocuments({ role: 'admin', isActive: true });
  const suspendedUsers = await User.countDocuments({ isSuspended: true });

  // Job stats
  const totalJobs = await Job.countDocuments({ isActive: true });
  const openJobs = await Job.countDocuments({ status: 'open', isActive: true });
  const inProgressJobs = await Job.countDocuments({ status: 'in_progress', isActive: true });
  const completedJobs = await Job.countDocuments({ status: 'completed', isActive: true });

  // Application stats
  const totalApplications = await Application.countDocuments();
  const pendingApplications = await Application.countDocuments({ status: 'pending' });
  const acceptedApplications = await Application.countDocuments({ status: 'accepted' });

  // Revenue stats (if transactions exist)
  let totalRevenue = 0;
  try {
    const revenueResult = await Transaction.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;
  } catch (error) {
    console.log('Transaction model not available or no transactions');
  }

  // Recent activity - last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const newUsersThisMonth = await User.countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
    isActive: true
  });

  const newJobsThisMonth = await Job.countDocuments({
    createdAt: { $gte: thirtyDaysAgo },
    isActive: true
  });

  res.json({
    success: true,
    stats: {
      users: {
        total: totalUsers,
        clients: totalClients,
        freelancers: totalFreelancers,
        admins: totalAdmins,
        suspended: suspendedUsers,
        newThisMonth: newUsersThisMonth
      },
      jobs: {
        total: totalJobs,
        open: openJobs,
        inProgress: inProgressJobs,
        completed: completedJobs,
        newThisMonth: newJobsThisMonth
      },
      applications: {
        total: totalApplications,
        pending: pendingApplications,
        accepted: acceptedApplications
      },
      revenue: {
        total: totalRevenue
      }
    }
  });
});

// @desc    Get all users (paginated, searchable)
// @route   GET /api/admin/users
// @access  Private (Admin only)
export const getAllUsers = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const { role, search, isSuspended } = req.query;

  // Build query
  const query = {};

  if (role && role !== 'all') {
    query.role = role;
  }

  if (isSuspended !== undefined) {
    query.isSuspended = isSuspended === 'true';
  }

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query)
  ]);

  // Get job/application counts for each user
  const usersWithStats = await Promise.all(users.map(async (user) => {
    let jobsPosted = 0;
    let applicationsSubmitted = 0;

    if (user.role === 'client') {
      jobsPosted = await Job.countDocuments({ client: user._id, isActive: true });
    } else if (user.role === 'freelancer') {
      applicationsSubmitted = await Application.countDocuments({ freelancer: user._id });
    }

    return {
      ...user,
      stats: {
        jobsPosted,
        applicationsSubmitted
      }
    };
  }));

  res.json({
    success: true,
    users: usersWithStats,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get user by ID with full details
// @route   GET /api/admin/users/:id
// @access  Private (Admin only)
export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate('suspendedBy', 'firstName lastName email')
    .select('-__v');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // Get user's jobs if client
  let jobs = [];
  if (user.role === 'client') {
    jobs = await Job.find({ client: user._id })
      .select('title status budget createdAt')
      .sort({ createdAt: -1 })
      .limit(10);
  }

  // Get user's applications if freelancer
  let applications = [];
  if (user.role === 'freelancer') {
    applications = await Application.find({ freelancer: user._id })
      .populate('job', 'title budget')
      .select('status proposedRate createdAt')
      .sort({ createdAt: -1 })
      .limit(10);
  }

  res.json({
    success: true,
    user: {
      ...user.toObject(),
      recentJobs: jobs,
      recentApplications: applications
    }
  });
});

// @desc    Suspend user
// @route   POST /api/admin/users/:id/suspend
// @access  Private (Admin only)
export const suspendUser = asyncHandler(async (req, res) => {
  const { reason } = req.body;

  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (user.role === 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Cannot suspend admin users'
    });
  }

  if (user.isSuspended) {
    return res.status(400).json({
      success: false,
      message: 'User is already suspended'
    });
  }

  // Get admin user
  const admin = await User.findOne({ clerkId: req.userId });

  await user.suspend(admin._id, reason);

  res.json({
    success: true,
    message: 'User suspended successfully',
    user
  });
});

// @desc    Unsuspend user
// @route   POST /api/admin/users/:id/unsuspend
// @access  Private (Admin only)
export const unsuspendUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (!user.isSuspended) {
    return res.status(400).json({
      success: false,
      message: 'User is not suspended'
    });
  }

  await user.unsuspend();

  res.json({
    success: true,
    message: 'User unsuspended successfully',
    user
  });
});

// @desc    Delete user (soft delete)
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  if (user.role === 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Cannot delete admin users'
    });
  }

  // Soft delete
  user.isActive = false;
  await user.save();

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

// @desc    Get analytics data
// @route   GET /api/admin/analytics
// @access  Private (Admin only)
export const getAnalytics = asyncHandler(async (req, res) => {
  // User growth over last 12 months
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const userGrowth = await User.aggregate([
    {
      $match: {
        createdAt: { $gte: twelveMonthsAgo },
        isActive: true
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);

  // Jobs by category
  const jobsByCategory = await Job.aggregate([
    {
      $match: { isActive: true }
    },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  // Application success rate
  const applicationStats = await Application.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  res.json({
    success: true,
    analytics: {
      userGrowth,
      jobsByCategory,
      applicationStats
    }
  });
});