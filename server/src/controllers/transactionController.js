import Transaction from '../models/Transaction.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import Application from '../models/Application.js';

// @desc    Create escrow (when client accepts freelancer)
// @route   POST /api/transactions/escrow
// @access  Private (Client only)
export const createEscrow = async (req, res) => {
  try {
    const { jobId, applicationId, amount } = req.body;

    // Validate required fields
    if (!jobId || !applicationId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'Please provide jobId, applicationId, and amount',
      });
    }

    // Get current user (client)
    const client = await User.findOne({ clerkId: req.userId });
    if (!client) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get job
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    // Verify user is the job owner
    if (job.postedBy.toString() !== client._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the job owner can create escrow',
      });
    }

    // Get application
    const application = await Application.findById(applicationId).populate('freelancer');
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Check if escrow already exists for this job
    const existingEscrow = await Transaction.findOne({ 
      job: jobId, 
      status: 'in_escrow' 
    });
    
    if (existingEscrow) {
      return res.status(400).json({
        success: false,
        message: 'Escrow already exists for this job',
      });
    }

    // Create escrow transaction
    const transaction = await Transaction.create({
      client: client._id,
      freelancer: application.freelancer._id,
      job: jobId,
      application: applicationId,
      amount,
      status: 'in_escrow',
      escrowedAt: new Date(),
    });

    // Update job with escrow info
    await Job.findByIdAndUpdate(jobId, {
      paymentStatus: 'in_escrow',
      escrowAmount: amount,
    });

    // Populate for response
    await transaction.populate('client', 'firstName lastName email');
    await transaction.populate('freelancer', 'firstName lastName email');
    await transaction.populate('job', 'title budget');

    res.status(201).json({
      success: true,
      message: 'Funds placed in escrow successfully',
      data: transaction,
    });
  } catch (error) {
    console.error('Create escrow error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating escrow',
      error: error.message,
    });
  }
};

// @desc    Release escrow to freelancer
// @route   POST /api/transactions/:id/release
// @access  Private (Client only)
export const releaseEscrow = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    // Get transaction
    const transaction = await Transaction.findById(id).populate('job');
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    // Get current user
    const user = await User.findOne({ clerkId: req.userId });

    // Verify user is the client
    if (transaction.client.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the client can release escrow',
      });
    }

    // Check status
    if (transaction.status !== 'in_escrow') {
      return res.status(400).json({
        success: false,
        message: `Cannot release escrow with status: ${transaction.status}`,
      });
    }

    // Release escrow
    transaction.status = 'released';
    transaction.releasedAt = new Date();
    transaction.releaseNote = note || 'Payment released by client';
    await transaction.save();

    // Update job status
    await Job.findByIdAndUpdate(transaction.job._id, {
      status: 'completed',
      paymentStatus: 'released',
    });

    // Populate for response
    await transaction.populate('client', 'firstName lastName email');
    await transaction.populate('freelancer', 'firstName lastName email');
    await transaction.populate('job', 'title budget');

    res.status(200).json({
      success: true,
      message: 'Payment released to freelancer successfully',
      data: transaction,
    });
  } catch (error) {
    console.error('Release escrow error:', error);
    res.status(500).json({
      success: false,
      message: 'Error releasing escrow',
      error: error.message,
    });
  }
};

// @desc    Request refund
// @route   POST /api/transactions/:id/refund
// @access  Private (Client only)
export const requestRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Get transaction
    const transaction = await Transaction.findById(id);
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    // Get current user
    const user = await User.findOne({ clerkId: req.userId });

    // Verify user is the client
    if (transaction.client.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Only the client can request a refund',
      });
    }

    // Check status
    if (transaction.status !== 'in_escrow') {
      return res.status(400).json({
        success: false,
        message: `Cannot refund escrow with status: ${transaction.status}`,
      });
    }

    // Process refund
    transaction.status = 'refunded';
    transaction.refundedAt = new Date();
    transaction.refundReason = reason || 'Refund requested by client';
    await transaction.save();

    // Update job status
    await Job.findByIdAndUpdate(transaction.job, {
      status: 'cancelled',
      paymentStatus: 'refunded',
    });

    res.status(200).json({
      success: true,
      message: 'Refund processed successfully',
      data: transaction,
    });
  } catch (error) {
    console.error('Request refund error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing refund',
      error: error.message,
    });
  }
};

// @desc    Get transaction by ID
// @route   GET /api/transactions/:id
// @access  Private
export const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findById(id)
      .populate('client', 'firstName lastName email profileImage')
      .populate('freelancer', 'firstName lastName email profileImage')
      .populate('job', 'title budget status');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    // Verify user is involved
    const user = await User.findOne({ clerkId: req.userId });
    const isClient = transaction.client._id.toString() === user._id.toString();
    const isFreelancer = transaction.freelancer._id.toString() === user._id.toString();

    if (!isClient && !isFreelancer) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this transaction',
      });
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transaction',
      error: error.message,
    });
  }
};

// @desc    Get user's transactions
// @route   GET /api/transactions/my-transactions
// @access  Private
export const getMyTransactions = async (req, res) => {
  try {
    const user = await User.findOne({ clerkId: req.userId });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get transactions where user is client or freelancer
    const transactions = await Transaction.find({
      $or: [{ client: user._id }, { freelancer: user._id }],
    })
      .populate('client', 'firstName lastName email profileImage')
      .populate('freelancer', 'firstName lastName email profileImage')
      .populate('job', 'title budget status')
      .sort({ createdAt: -1 });

    // Calculate summary
    const summary = {
      totalInEscrow: 0,
      totalReleased: 0,
      totalRefunded: 0,
    };

    transactions.forEach(t => {
      if (t.status === 'in_escrow') {
        summary.totalInEscrow += t.amount;
      } else if (t.status === 'released') {
        summary.totalReleased += t.amount;
      } else if (t.status === 'refunded') {
        summary.totalRefunded += t.amount;
      }
    });

    res.status(200).json({
      success: true,
      data: transactions,
      summary,
    });
  } catch (error) {
    console.error('Get my transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions',
      error: error.message,
    });
  }
};

// @desc    Get escrow for a job
// @route   GET /api/transactions/job/:jobId
// @access  Private
export const getJobTransaction = async (req, res) => {
  try {
    const { jobId } = req.params;

    const transaction = await Transaction.findOne({ job: jobId })
      .populate('client', 'firstName lastName email profileImage')
      .populate('freelancer', 'firstName lastName email profileImage')
      .populate('job', 'title budget status');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'No transaction found for this job',
      });
    }

    // Verify user is involved
    const user = await User.findOne({ clerkId: req.userId });
    const isClient = transaction.client._id.toString() === user._id.toString();
    const isFreelancer = transaction.freelancer._id.toString() === user._id.toString();

    if (!isClient && !isFreelancer) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this transaction',
      });
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    console.error('Get job transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transaction',
      error: error.message,
    });
  }
};