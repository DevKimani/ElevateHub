// server/src/models/User.js
import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    default: '',
  },
  lastName: {
    type: String,
    default: '',
  },
  role: {
    type: String,
    enum: ['client', 'freelancer', 'admin'],
    default: 'freelancer',
  },
  profileImage: {
    type: String,
    default: '',
  },
  bio: {
    type: String,
    default: '',
  },
  skills: [{
    type: String,
  }],
  hourlyRate: {
    type: Number,
    default: 0,
  },
  location: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    default: '',
  },
  portfolio: {
    type: String,
    default: '',
  },
  // ✅ NEW: Suspension and status fields
  isActive: {
    type: Boolean,
    default: true,
  },
  isSuspended: {
    type: Boolean,
    default: false,
  },
  suspendedAt: {
    type: Date,
    default: null,
  },
  suspendedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  suspensionReason: {
    type: String,
    default: '',
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes for performance
userSchema.index({ clerkId: 1 });
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ isSuspended: 1 });

// Methods
userSchema.methods.suspend = function(adminId, reason) {
  this.isSuspended = true;
  this.suspendedAt = new Date();
  this.suspendedBy = adminId;
  this.suspensionReason = reason || 'No reason provided';
  return this.save();
};

userSchema.methods.unsuspend = function() {
  this.isSuspended = false;
  this.suspendedAt = null;
  this.suspendedBy = null;
  this.suspensionReason = '';
  return this.save();
};

userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

const User = mongoose.model('User', userSchema);

export default User;