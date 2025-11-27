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
      
      // ✅ FIX: Set Clerk metadata when creating new user
      try {
        await clerkClient.users.updateUserMetadata(req.userId, {
          publicMetadata: {
            role: user.role,
            mongoId: user._id.toString()
          }
        });
        console.log('getCurrentUser: Clerk metadata set for new user');
      } catch (metadataError) {
        console.error('getCurrentUser: Error setting Clerk metadata:', metadataError);
      }
    } else {
      console.log('getCurrentUser: Existing user found:', user._id);
      
      // ✅ FIX: Check if Clerk metadata exists, set it if missing
      if (!clerkUser.publicMetadata?.role || !clerkUser.publicMetadata?.mongoId) {
        console.log('getCurrentUser: Clerk metadata missing, updating...');
        try {
          await clerkClient.users.updateUserMetadata(req.userId, {
            publicMetadata: {
              role: user.role,
              mongoId: user._id.toString()
            }
          });
          console.log('getCurrentUser: Clerk metadata updated for existing user');
        } catch (metadataError) {
          console.error('getCurrentUser: Error updating Clerk metadata:', metadataError);
        }
      }
    }
    
    res.status(200).json({
      success: true,
      user: user,  // Changed from 'data' to 'user' for consistency
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

    // Track if role changed
    const roleChanged = role && role !== user.role;

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

    // ✅ FIX: Update Clerk metadata if role changed or on any profile update
    if (roleChanged || role) {
      try {
        await clerkClient.users.updateUserMetadata(req.userId, {
          publicMetadata: {
            role: user.role,
            mongoId: user._id.toString()
          }
        });
        console.log('updateCurrentUser: Clerk metadata updated');
      } catch (metadataError) {
        console.error('updateCurrentUser: Error updating Clerk metadata:', metadataError);
        // Don't fail the request if metadata update fails
      }
    }

    res.status(200).json({
      success: true,
      user: user,  // Changed from 'data' to 'user' for consistency
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
      user: user,  // Changed from 'data' to 'user' for consistency
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

// @desc    Manually fix metadata for existing users (TEMPORARY ENDPOINT)
// @route   POST /api/users/fix-metadata
// @access  Private
export const fixUserMetadata = async (req, res) => {
  try {
    console.log('fixUserMetadata: Fixing metadata for user:', req.userId);
    
    const user = await User.findOne({ clerkId: req.userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found in database'
      });
    }
    
    // Update Clerk metadata
    await clerkClient.users.updateUserMetadata(req.userId, {
      publicMetadata: {
        role: user.role,
        mongoId: user._id.toString()
      }
    });
    
    console.log('fixUserMetadata: Metadata updated successfully');
    
    res.status(200).json({
      success: true,
      message: 'Metadata fixed successfully',
      metadata: {
        role: user.role,
        mongoId: user._id.toString()
      }
    });
  } catch (error) {
    console.error('Fix metadata error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fixing metadata',
      error: error.message,
    });
  }
};