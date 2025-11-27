// server/src/models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true
    // REMOVED: index: true (to avoid duplicate with schema.index() below)
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
    // REMOVED: index: true (to avoid duplicate with schema.index() below)
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['client', 'freelancer'],
    required: true
  },
  profilePicture: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  skills: [{
    type: String,
    trim: true
  }],
  hourlyRate: {
    type: Number,
    min: 0
  },
  location: {
    type: String,
    default: ''
  },
  phoneNumber: {
    type: String,
    default: ''
  },
  escrowBalance: {
    type: Number,
    default: 0,
    min: 0
  },
  completedJobs: {
    type: Number,
    default: 0
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add indexes separately (not on field definition)
// This prevents the duplicate index warning
userSchema.index({ clerkId: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtuals are included
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.model('User', userSchema);

export default User;