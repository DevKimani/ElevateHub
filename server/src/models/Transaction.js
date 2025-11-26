// server/src/models/Transaction.js
import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  job: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Job', 
    required: true,
    index: true
  },
  client: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  freelancer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  amount: { 
    type: Number, 
    required: true,
    min: [0, 'Amount cannot be negative']
  },
  currency: {
    type: String,
    default: 'KES',
    enum: ['KES', 'USD', 'EUR', 'GBP']
  },
  status: {
    type: String,
    enum: ['pending', 'held', 'released', 'refunded', 'disputed', 'cancelled'],
    default: 'pending',
    index: true
  },
  type: {
    type: String,
    enum: ['escrow_deposit', 'payment_release', 'refund', 'mpesa_deposit', 'platform_fee'],
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['escrow_wallet', 'mpesa', 'bank_transfer', 'card'],
    default: 'escrow_wallet'
  },
  
  // M-Pesa specific fields
  mpesaReceiptNumber: {
    type: String,
    sparse: true,
    index: true
  },
  mpesaTransactionId: String,
  mpesaPhoneNumber: String,
  
  // Transaction lifecycle dates
  initiatedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  releaseDate: Date,
  refundedAt: Date,
  
  // Dispute management
  disputeReason: String,
  disputeStatus: {
    type: String,
    enum: ['none', 'open', 'investigating', 'resolved', 'closed'],
    default: 'none'
  },
  disputeResolvedAt: Date,
  disputeResolution: String,
  
  // Audit trail
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'held', 'released', 'refunded', 'disputed', 'cancelled']
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String,
    metadata: mongoose.Schema.Types.Mixed
  }],
  
  // Metadata for tracking
  metadata: {
    ipAddress: String,
    userAgent: String,
    platform: String,
    referenceId: String,
    notes: String
  },
  
  // Platform fee
  platformFee: {
    type: Number,
    default: 0
  },
  platformFeePercentage: {
    type: Number,
    default: 10 // 10% platform fee
  },
  
  // Prevent double spending
  processed: {
    type: Boolean,
    default: false,
    index: true
  },
  processedAt: Date,
  processingLock: {
    type: Boolean,
    default: false
  },
  lockExpiresAt: Date
  
}, { 
  timestamps: true 
});

// Compound indexes for queries
transactionSchema.index({ job: 1, status: 1 });
transactionSchema.index({ client: 1, createdAt: -1 });
transactionSchema.index({ freelancer: 1, createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ type: 1, status: 1 });

// Prevent duplicate transactions
transactionSchema.index(
  { job: 1, type: 1, status: 1 }, 
  { 
    unique: true, 
    partialFilterExpression: { 
      type: 'escrow_deposit', 
      status: { $in: ['pending', 'held'] } 
    } 
  }
);

// Methods
transactionSchema.methods.updateStatus = function(newStatus, userId, reason = '', metadata = {}) {
  this.statusHistory.push({
    status: this.status, // Old status
    changedAt: new Date(),
    changedBy: userId,
    reason,
    metadata
  });
  
  this.status = newStatus;
  
  if (newStatus === 'released') {
    this.releaseDate = new Date();
    this.completedAt = new Date();
  } else if (newStatus === 'refunded') {
    this.refundedAt = new Date();
    this.completedAt = new Date();
  }
  
  return this.save();
};

// Acquire processing lock to prevent race conditions
transactionSchema.methods.acquireLock = async function() {
  const lockDuration = 30000; // 30 seconds
  const now = new Date();
  
  // Check if lock is expired
  if (this.processingLock && this.lockExpiresAt && this.lockExpiresAt > now) {
    throw new Error('Transaction is currently being processed');
  }
  
  this.processingLock = true;
  this.lockExpiresAt = new Date(now.getTime() + lockDuration);
  await this.save();
};

// Release processing lock
transactionSchema.methods.releaseLock = async function() {
  this.processingLock = false;
  this.lockExpiresAt = null;
  await this.save();
};

// Mark as processed
transactionSchema.methods.markAsProcessed = async function() {
  if (this.processed) {
    throw new Error('Transaction already processed');
  }
  
  this.processed = true;
  this.processedAt = new Date();
  this.processingLock = false;
  this.lockExpiresAt = null;
  await this.save();
};

// Statics
transactionSchema.statics.createEscrow = async function(jobId, clientId, freelancerId, amount) {
  // Check if escrow already exists for this job
  const existingEscrow = await this.findOne({
    job: jobId,
    type: 'escrow_deposit',
    status: { $in: ['pending', 'held'] }
  });
  
  if (existingEscrow) {
    throw new Error('Escrow already exists for this job');
  }
  
  const platformFeePercentage = 10;
  const platformFee = (amount * platformFeePercentage) / 100;
  
  return this.create({
    job: jobId,
    client: clientId,
    freelancer: freelancerId,
    amount,
    platformFee,
    platformFeePercentage,
    type: 'escrow_deposit',
    status: 'held',
    statusHistory: [{
      status: 'pending',
      changedAt: new Date(),
      reason: 'Escrow created'
    }]
  });
};

// Virtual for net amount (after platform fee)
transactionSchema.virtual('netAmount').get(function() {
  return this.amount - this.platformFee;
});

// Ensure virtuals are included in JSON
transactionSchema.set('toJSON', { virtuals: true });
transactionSchema.set('toObject', { virtuals: true });

// Pre-save middleware to calculate platform fee
transactionSchema.pre('save', function(next) {
  if (this.isNew && this.type === 'escrow_deposit') {
    if (!this.platformFee && this.amount) {
      this.platformFee = (this.amount * this.platformFeePercentage) / 100;
    }
  }
  next();
});

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;