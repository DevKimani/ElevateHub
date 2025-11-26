// server/src/models/Job.js
import mongoose from 'mongoose';

// Submission schema for work submissions
const submissionSchema = new mongoose.Schema({
  submittedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  description: { 
    type: String, 
    required: true,
    minlength: [50, 'Description must be at least 50 characters'],
    maxlength: [2000, 'Description must not exceed 2000 characters']
  },
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    fileType: String,
    fileSize: Number,
    uploadedAt: { 
      type: Date, 
      default: Date.now 
    }
  }],
  status: {
    type: String,
    enum: ['submitted', 'under_review', 'approved', 'revision_requested'],
    default: 'submitted'
  },
  reviewNotes: {
    type: String,
    maxlength: [1000, 'Review notes must not exceed 1000 characters']
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  submittedAt: { 
    type: Date, 
    default: Date.now 
  },
  revisionNumber: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

const jobSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: [true, 'Job title is required'],
    trim: true,
    minlength: [10, 'Title must be at least 10 characters'],
    maxlength: [100, 'Title must not exceed 100 characters'],
    index: 'text'
  },
  description: { 
    type: String, 
    required: [true, 'Job description is required'],
    trim: true,
    minlength: [50, 'Description must be at least 50 characters'],
    maxlength: [5000, 'Description must not exceed 5000 characters'],
    index: 'text'
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: [
        'Web Development',
        'Mobile Development',
        'Design',
        'Writing',
        'Marketing',
        'Data Entry',
        'Virtual Assistant',
        'Other'
      ],
      message: 'Invalid category'
    },
    index: true
  },
  budget: { 
    type: Number, 
    required: [true, 'Budget is required'],
    min: [100, 'Budget must be at least KES 100']
  },
  currency: {
    type: String,
    default: 'KES',
    enum: ['KES', 'USD', 'EUR', 'GBP']
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'submitted', 'completed', 'cancelled'],
    default: 'open',
    index: true
  },
  client: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  acceptedFreelancer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    index: true
  },
  
  // Application management
  applicationsCount: {
    type: Number,
    default: 0
  },
  
  // Deadline
  deadline: {
    type: Date,
    validate: {
      validator: function(value) {
        return !value || value > new Date();
      },
      message: 'Deadline must be in the future'
    }
  },
  
  // Work submission system
  submissions: [submissionSchema],
  currentSubmission: { 
    type: mongoose.Schema.Types.ObjectId 
  },
  revisionCount: { 
    type: Number, 
    default: 0 
  },
  maxRevisions: { 
    type: Number, 
    default: 3 
  },
  
  // Payment tracking
  escrowCreated: {
    type: Boolean,
    default: false
  },
  escrowAmount: Number,
  paymentReleased: {
    type: Boolean,
    default: false
  },
  paymentReleasedAt: Date,
  
  // Completion tracking
  startedAt: Date,
  completedAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
  
  // Skills required (optional)
  skills: [{
    type: String,
    trim: true
  }],
  
  // Tags for better searchability
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Experience level required
  experienceLevel: {
    type: String,
    enum: ['entry', 'intermediate', 'expert', 'any'],
    default: 'any'
  },
  
  // View count for analytics
  viewCount: {
    type: Number,
    default: 0
  },
  
  // Visibility
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Featured job
  isFeatured: {
    type: Boolean,
    default: false
  }
  
}, { 
  timestamps: true 
});

// Indexes for performance
jobSchema.index({ client: 1, status: 1 });
jobSchema.index({ acceptedFreelancer: 1, status: 1 });
jobSchema.index({ category: 1, status: 1 });
jobSchema.index({ budget: 1 });
jobSchema.index({ createdAt: -1 });
jobSchema.index({ deadline: 1 });
jobSchema.index({ title: 'text', description: 'text', tags: 'text' });
jobSchema.index({ isActive: 1, status: 1, createdAt: -1 });

// Virtual for days remaining
jobSchema.virtual('daysRemaining').get(function() {
  if (!this.deadline) return null;
  const now = new Date();
  const diff = this.deadline - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

// Virtual for is overdue
jobSchema.virtual('isOverdue').get(function() {
  if (!this.deadline) return false;
  return new Date() > this.deadline;
});

// Virtual for can submit work
jobSchema.virtual('canSubmitWork').get(function() {
  return this.status === 'in_progress' && 
         this.acceptedFreelancer && 
         this.revisionCount < this.maxRevisions;
});

// Virtual for latest submission
jobSchema.virtual('latestSubmission').get(function() {
  if (!this.submissions || this.submissions.length === 0) return null;
  return this.submissions[this.submissions.length - 1];
});

// Ensure virtuals are included
jobSchema.set('toJSON', { virtuals: true });
jobSchema.set('toObject', { virtuals: true });

// Methods
jobSchema.methods.addSubmission = async function(submissionData) {
  if (this.revisionCount >= this.maxRevisions) {
    throw new Error('Maximum number of revisions reached');
  }
  
  if (this.status !== 'in_progress') {
    throw new Error('Can only submit work for jobs in progress');
  }
  
  const submission = {
    ...submissionData,
    revisionNumber: this.revisionCount
  };
  
  this.submissions.push(submission);
  this.currentSubmission = this.submissions[this.submissions.length - 1]._id;
  this.status = 'submitted';
  
  await this.save();
  return this.submissions[this.submissions.length - 1];
};

jobSchema.methods.reviewSubmission = async function(submissionId, status, reviewNotes, reviewerId) {
  const submission = this.submissions.id(submissionId);
  
  if (!submission) {
    throw new Error('Submission not found');
  }
  
  submission.status = status;
  submission.reviewNotes = reviewNotes;
  submission.reviewedBy = reviewerId;
  submission.reviewedAt = new Date();
  
  if (status === 'approved') {
    this.status = 'completed';
    this.completedAt = new Date();
  } else if (status === 'revision_requested') {
    this.status = 'in_progress';
    this.revisionCount += 1;
    
    if (this.revisionCount >= this.maxRevisions) {
      throw new Error('Maximum revisions reached. Please discuss with the client.');
    }
  }
  
  await this.save();
  return submission;
};

jobSchema.methods.acceptFreelancer = async function(freelancerId) {
  if (this.status !== 'open') {
    throw new Error('Job is not open for applications');
  }
  
  this.acceptedFreelancer = freelancerId;
  this.status = 'in_progress';
  this.startedAt = new Date();
  
  await this.save();
  return this;
};

jobSchema.methods.cancel = async function(reason) {
  if (this.status === 'completed') {
    throw new Error('Cannot cancel a completed job');
  }
  
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancellationReason = reason;
  this.isActive = false;
  
  await this.save();
  return this;
};

jobSchema.methods.incrementViews = async function() {
  this.viewCount += 1;
  await this.save();
};

// Statics
jobSchema.statics.findActive = function(filters = {}) {
  return this.find({ 
    isActive: true, 
    status: 'open',
    ...filters 
  });
};

jobSchema.statics.findByCategory = function(category) {
  return this.find({ 
    category, 
    isActive: true, 
    status: 'open' 
  });
};

// Pre-save middleware
jobSchema.pre('save', function(next) {
  // Ensure tags are lowercase
  if (this.tags) {
    this.tags = this.tags.map(tag => tag.toLowerCase());
  }
  
  // Set escrow amount when freelancer is accepted
  if (this.isModified('acceptedFreelancer') && this.acceptedFreelancer && !this.escrowAmount) {
    this.escrowAmount = this.budget;
  }
  
  next();
});

// Post-save middleware for logging
jobSchema.post('save', function(doc) {
  if (doc.status === 'completed') {
    console.log(`Job ${doc._id} completed at ${doc.completedAt}`);
  }
});

const Job = mongoose.model('Job', jobSchema);

export default Job;