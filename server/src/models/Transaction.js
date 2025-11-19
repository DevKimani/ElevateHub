import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    // Transaction parties
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    freelancer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    
    // Related job
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
    },
    
    // Amount
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'KES',
    },
    
    // Status
    status: {
      type: String,
      enum: ['in_escrow', 'released', 'refunded', 'disputed'],
      default: 'in_escrow',
    },
    
    // Timestamps for status changes
    escrowedAt: {
      type: Date,
      default: Date.now,
    },
    releasedAt: {
      type: Date,
    },
    refundedAt: {
      type: Date,
    },
    
    // Notes
    releaseNote: {
      type: String,
    },
    refundReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
transactionSchema.index({ client: 1, status: 1 });
transactionSchema.index({ freelancer: 1, status: 1 });
transactionSchema.index({ job: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;