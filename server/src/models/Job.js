import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Web Development',
      'Mobile Development',
      'Design & Creative',
      'Writing & Content',
      'Digital Marketing',
      'Data & Analytics',
      'Admin & Customer Support',
      'Other'
    ],
  },
  budget: {
    type: Number,
    required: true,
    min: 0,
  },
  budgetType: {
    type: String,
    enum: ['fixed', 'hourly'],
    default: 'fixed',
  },
  deadline: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'completed', 'closed'],
    default: 'open',
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  acceptedFreelancer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  skills: [{
    type: String,
  }],
  applicationsCount: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
jobSchema.index({ status: 1, createdAt: -1 });
jobSchema.index({ category: 1 });
jobSchema.index({ postedBy: 1 });

const Job = mongoose.model('Job', jobSchema);

export default Job;