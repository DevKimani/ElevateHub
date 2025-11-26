// server/src/controllers/transactionController.js
import Transaction from '../models/Transaction.js';
import Job from '../models/Job.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { asyncHandler } from '../middleware/errorHandler.js';

// @desc    Create escrow when accepting freelancer
// @route   POST /api/transactions/escrow
// @access  Private (Client only)
export const createEscrow = asyncHandler(async (req, res) => {
  const { jobId, amount } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Get user
    const user = await User.findOne({ clerkId: req.userId }).session(session);
    
    if (!user || user.role !== 'client') {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: 'Only clients can create escrow'
      });
    }

    // Get job
    const job = await Job.findById(jobId).session(session);

    if (!job) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Verify client owns the job
    if (!job.client.equals(user._id)) {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create escrow for this job'
      });
    }

    // Verify job has accepted freelancer
    if (!job.acceptedFreelancer) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'No freelancer accepted for this job'
      });
    }

    // Check if escrow already exists
    if (job.escrowCreated) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Escrow already created for this job'
      });
    }

    // Verify client has sufficient balance
    const escrowAmount = amount || job.budget;
    if (user.escrowBalance < escrowAmount) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance for escrow',
        required: escrowAmount,
        available: user.escrowBalance
      });
    }

    // Create escrow transaction
    const transaction = await Transaction.createEscrow(
      jobId,
      user._id,
      job.acceptedFreelancer,
      escrowAmount
    );

    // Deduct from client balance
    user.escrowBalance -= escrowAmount;
    await user.save({ session });

    // Update job
    job.escrowCreated = true;
    job.escrowAmount = escrowAmount;
    await job.save({ session });

    await session.commitTransaction();

    await transaction.populate([
      { path: 'client', select: 'firstName lastName email' },
      { path: 'freelancer', select: 'firstName lastName email' },
      { path: 'job', select: 'title description' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Escrow created successfully',
      transaction
    });

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

// @desc    Release payment to freelancer
// @route   POST /api/transactions/release/:jobId
// @access  Private (Client only)
export const releasePayment = asyncHandler(async (req, res) => {
  const { jobId } = req.params;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Get user
    const user = await User.findOne({ clerkId: req.userId }).session(session);

    if (!user || user.role !== 'client') {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: 'Only clients can release payment'
      });
    }

    // Find job with atomic update to prevent double release
    const job = await Job.findOneAndUpdate(
      { 
        _id: jobId,
        client: user._id,
        status: { $in: ['submitted', 'in_progress', 'completed'] },
        paymentReleased: { $ne: true },
        escrowCreated: true
      },
      { 
        $set: { 
          status: 'completed',
          paymentReleased: true,
          paymentReleasedAt: new Date(),
          completedAt: new Date()
        }
      },
      { 
        new: true,
        session
      }
    );

    if (!job) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Cannot release payment. Job may be already completed, payment already released, or no escrow exists.'
      });
    }

    // Find and update transaction atomically
    const transaction = await Transaction.findOneAndUpdate(
      { 
        job: jobId,
        status: 'held',
        processed: { $ne: true }
      },
      { 
        $set: {
          status: 'released',
          releaseDate: new Date(),
          completedAt: new Date(),
          processed: true,
          processedAt: new Date()
        }
      },
      { 
        new: true,
        session
      }
    );

    if (!transaction) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'No held transaction found or already processed'
      });
    }

    // Update freelancer balance
    const freelancer = await User.findByIdAndUpdate(
      job.acceptedFreelancer,
      { 
        $inc: { escrowBalance: transaction.netAmount }
      },
      { 
        new: true,
        session
      }
    );

    if (!freelancer) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Freelancer not found'
      });
    }

    await session.commitTransaction();

    await transaction.populate([
      { path: 'client', select: 'firstName lastName email' },
      { path: 'freelancer', select: 'firstName lastName email' },
      { path: 'job', select: 'title description' }
    ]);

    // Emit socket event
    const io = req.app.get('io');
    io.to(freelancer._id.toString()).emit('payment-received', {
      jobId: job._id,
      jobTitle: job.title,
      amount: transaction.netAmount
    });

    res.json({
      success: true,
      message: 'Payment released successfully',
      transaction,
      freelancerNewBalance: freelancer.escrowBalance
    });

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

// @desc    Request refund
// @route   POST /api/transactions/refund/:jobId
// @access  Private (Client only)
export const requestRefund = asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { reason } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const user = await User.findOne({ clerkId: req.userId }).session(session);

    if (!user || user.role !== 'client') {
      await session.abortTransaction();
      return res.status(403).json({
        success: false,
        message: 'Only clients can request refunds'
      });
    }

    // Find job
    const job = await Job.findOne({
      _id: jobId,
      client: user._id,
      escrowCreated: true,
      paymentReleased: { $ne: true }
    }).session(session);

    if (!job) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Cannot refund. Job not found, no escrow, or payment already released.'
      });
    }

    // Find transaction
    const transaction = await Transaction.findOneAndUpdate(
      { 
        job: jobId,
        status: 'held',
        processed: { $ne: true }
      },
      {
        $set: {
          status: 'refunded',
          refundedAt: new Date(),
          completedAt: new Date(),
          processed: true,
          processedAt: new Date(),
          metadata: {
            ...transaction?.metadata,
            refundReason: reason
          }
        }
      },
      { 
        new: true,
        session
      }
    );

    if (!transaction) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'No held transaction found'
      });
    }

    // Refund to client
    user.escrowBalance += transaction.amount;
    await user.save({ session });

    // Update job
    job.status = 'cancelled';
    job.cancellationReason = reason;
    job.cancelledAt = new Date();
    await job.save({ session });

    await session.commitTransaction();

    res.json({
      success: true,
      message: 'Refund processed successfully',
      transaction,
      newBalance: user.escrowBalance
    });

  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
});

// @desc    Get user transactions
// @route   GET /api/transactions
// @access  Private
export const getMyTransactions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const user = await User.findOne({ clerkId: req.userId });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  const query = {
    $or: [
      { client: user._id },
      { freelancer: user._id }
    ]
  };

  if (req.query.status) {
    query.status = req.query.status;
  }

  if (req.query.type) {
    query.type = req.query.type;
  }

  const [transactions, total] = await Promise.all([
    Transaction.find(query)
      .populate('client', 'firstName lastName profilePicture')
      .populate('freelancer', 'firstName lastName profilePicture')
      .populate('job', 'title category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Transaction.countDocuments(query)
  ]);

  res.json({
    success: true,
    transactions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

// @desc    Get transaction by ID
// @route   GET /api/transactions/:id
// @access  Private
export const getTransactionById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findOne({ clerkId: req.userId });

  const transaction = await Transaction.findById(id)
    .populate('client', 'firstName lastName email profilePicture')
    .populate('freelancer', 'firstName lastName email profilePicture')
    .populate('job', 'title description category budget');

  if (!transaction) {
    return res.status(404).json({
      success: false,
      message: 'Transaction not found'
    });
  }

  // Verify user is part of transaction
  if (!transaction.client.equals(user._id) && !transaction.freelancer.equals(user._id)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to view this transaction'
    });
  }

  res.json({
    success: true,
    transaction
  });
});

// @desc    Add funds to wallet (for testing/demo)
// @route   POST /api/transactions/add-funds
// @access  Private
export const addFunds = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  if (!amount || amount < 100) {
    return res.status(400).json({
      success: false,
      message: 'Amount must be at least KES 100'
    });
  }

  const user = await User.findOne({ clerkId: req.userId });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  user.escrowBalance += amount;
  await user.save();

  res.json({
    success: true,
    message: 'Funds added successfully',
    newBalance: user.escrowBalance
  });
});

export default {
  createEscrow,
  releasePayment,
  requestRefund,
  getMyTransactions,
  getTransactionById,
  addFunds
};