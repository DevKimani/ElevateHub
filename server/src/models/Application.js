import mongoose from 'mongoose';

const applicationSchema = new mongoose.Schema({
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true,
  },
  freelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  coverLetter: {
    type: String,
    required: true,
    maxlength: 1000,
  },
  proposedRate: {
    type: Number,
    required: true,
    min: 0,
  },
  proposedDeadline: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
  },
  attachments: [{
    name: String,
    url: String,
  }],
}, {
  timestamps: true,
});

// Compound index to prevent duplicate applications
applicationSchema.index({ job: 1, freelancer: 1 }, { unique: true });
applicationSchema.index({ freelancer: 1, createdAt: -1 });
applicationSchema.index({ job: 1, status: 1 });

const Application = mongoose.model('Application', applicationSchema);

export default Application;