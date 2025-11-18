import User from '../models/User.js';
import { createClerkClient } from '@clerk/backend';

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
});

// @desc    Get or Create current user
// @route   GET /api/users/me
// @access  Private
export const getCurrentUser = async (req, res) => {
  try {
    console.log('getCurrentUser: userId from token:', req.userId);
    
    // Get user info from Clerk
    const clerkUser = await clerkClient.users.getUser(req.userId);
    console.log('getCurrentUser: Clerk user fetched:', clerkUser.id);
    
    // Check if user exists in our database
    let user = await User.findOne({ clerkId: req.userId });
    
    if (!user) {
      console.log('getCurrentUser: User not found in DB, creating new user');
      // Create new user if doesn't exist
      user = await User.create({
        clerkId: req.userId,
        email: clerkUser.emailAddresses[0].emailAddress,
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
        profileImage: clerkUser.imageUrl || '',
        role: 'freelancer', // Default role
      });
      console.log('getCurrentUser: New user created:', user._id);
    } else {
      console.log('getCurrentUser: Existing user found:', user._id);
    }
    
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message,
    });
  }
};

// @desc    Update current user profile
// @route   PUT /api/users/me
// @access  Private
export const updateCurrentUser = async (req, res) => {
  try {
    const {
      role,
      bio,
      skills,
      hourlyRate,
      location,
      phone,
      portfolio,
    } = req.body;

    console.log('updateCurrentUser: userId:', req.userId);

    // Find user
    const user = await User.findOne({ clerkId: req.userId });

    if (!user) {
      console.log('updateCurrentUser: User not found in DB');
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update fields
    if (role) user.role = role;
    if (bio !== undefined) user.bio = bio;
    if (skills) user.skills = skills;
    if (hourlyRate !== undefined) user.hourlyRate = hourlyRate;
    if (location !== undefined) user.location = location;
    if (phone !== undefined) user.phone = phone;
    if (portfolio) user.portfolio = portfolio;

    await user.save();
    console.log('updateCurrentUser: User updated successfully');

    res.status(200).json({
      success: true,
      data: user,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message,
    });
  }
};

// @desc    Get public user profile by ID
// @route   GET /api/users/:id
// @access  Public
export const getUserById = async (req, res) => {
  try {
    console.log('getUserById: Fetching user with ID:', req.params.id);
    
    const user = await User.findById(req.params.id).select('-__v');

    if (!user) {
      console.log('getUserById: User not found');
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    console.log('getUserById: User found:', user._id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message,
    });
  }
};