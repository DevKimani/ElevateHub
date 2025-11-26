// server/src/models/Application.js
import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
    index: true
  },
  freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  coverLetter: {
    type: String,
    required: [true, 'Cover letter is required'],
    minlength: [100, 'Cover letter must be at least 100 characters'],
    maxlength: [2000, 'Cover letter must not exceed 2000 characters']
  },
  proposedBudget: {
    type: Number,
    required: [true, 'Proposed budget is required'],
    min: [1, 'Proposed budget must be at least 1']
  },
  estimatedDuration: {
    type: Number, // in days
    min: [1, 'Estimated duration must be at least 1 day']
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'withdrawn'],
    default: 'pending',
    index: true
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'withdrawn']
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String
  }],
  withdrawnAt: Date,
  withdrawalReason: String,
  attachments: [{
    filename: String,
    url: String,
    fileType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for performance
applicationSchema.index({ job: 1, freelancer: 1 }, { unique: true }); // Prevent duplicate applications
applicationSchema.index({ freelancer: 1, status: 1 });
applicationSchema.index({ job: 1, status: 1 });
applicationSchema.index({ createdAt: -1 });

// Methods
applicationSchema.methods.updateStatus = function(newStatus, userId, reason = '') {
  // Add current status to history
  this.statusHistory.push({
    status: this.status,
    changedAt: new Date(),
    changedBy: userId,
    reason
  });

  // Update to new status
  this.status = newStatus;

  return this.save();
};

applicationSchema.methods.withdraw = function(reason) {
  if (this.status !== 'pending') {
    throw new Error('Can only withdraw pending applications');
  }

  this.status = 'withdrawn';
  this.withdrawnAt = new Date();
  this.withdrawalReason = reason;

  return this.save();
};

// Statics
applicationSchema.statics.findByJob = function(jobId, filters = {}) {
  return this.find({ job: jobId, ...filters })
    .populate('freelancer', 'firstName lastName profilePicture skills hourlyRate')
    .sort({ createdAt: -1 });
};

applicationSchema.statics.findByFreelancer = function(freelancerId, filters = {}) {
  return this.find({ freelancer: freelancerId, ...filters })
    .populate({
      path: 'job',
      select: 'title budget category deadline status client',
      populate: {
        path: 'client',
        select: 'firstName lastName profilePicture'
      }
    })
    .sort({ createdAt: -1 });
};

// Virtual for application age
applicationSchema.virtual('daysOld').get(function() {
  const now = new Date();
  const diff = now - this.createdAt;
  return Math.floor(diff / (1000 * 60 * 60 * 24));
});

// Ensure virtuals are included
applicationSchema.set('toJSON', { virtuals: true });
applicationSchema.set('toObject', { virtuals: true });

const Application = mongoose.model('Application', applicationSchema);

export default Application;