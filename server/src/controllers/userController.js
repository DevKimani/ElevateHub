import User from '../models/User.js';
import { createClerkClient } from '@clerk/backend';
import logger from '../utils/logger.js';

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
});

// @desc    Get or Create current user
// @route   GET /api/users/me
// @access  Private
export const getCurrentUser = async (req, res) => {
  try {
    logger.debug('getCurrentUser: userId from token:', { userId: req.userId });

    // Get user info from Clerk
    const clerkUser = await clerkClient.users.getUser(req.userId);
    logger.debug('getCurrentUser: Clerk user fetched:', { clerkUserId: clerkUser.id });

    // Check if user exists in our database
    let user = await User.findOne({ clerkId: req.userId });

    if (!user) {
      logger.info('getCurrentUser: User not found in DB, creating new user', { userId: req.userId });
      // Create new user if doesn't exist
      user = await User.create({
        clerkId: req.userId,
        email: clerkUser.emailAddresses[0].emailAddress,
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
        profileImage: clerkUser.imageUrl || '',
        role: 'freelancer', // Default role
      });
      logger.info('getCurrentUser: New user created', { mongoId: user._id });

      // ✅ FIX: Set Clerk metadata when creating new user
      try {
        await clerkClient.users.updateUserMetadata(req.userId, {
          publicMetadata: {
            role: user.role,
            mongoId: user._id.toString()
          }
        });
        logger.info('getCurrentUser: Clerk metadata set for new user');
      } catch (metadataError) {
        logger.error('getCurrentUser: Error setting Clerk metadata:', metadataError);
      }
    } else {
      logger.debug('getCurrentUser: Existing user found', { mongoId: user._id });

      // ✅ FIX: Check if Clerk metadata exists, set it if missing
      if (!clerkUser.publicMetadata?.role || !clerkUser.publicMetadata?.mongoId) {
        logger.info('getCurrentUser: Clerk metadata missing, updating...');
        try {
          await clerkClient.users.updateUserMetadata(req.userId, {
            publicMetadata: {
              role: user.role,
              mongoId: user._id.toString()
            }
          });
          logger.info('getCurrentUser: Clerk metadata updated for existing user');
        } catch (metadataError) {
          logger.error('getCurrentUser: Error updating Clerk metadata:', metadataError);
        }
      }
    }
    
    res.status(200).json({
      success: true,
      user: user,  // Changed from 'data' to 'user' for consistency
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
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

    logger.debug('updateCurrentUser: userId:', { userId: req.userId });

    // Find user
    const user = await User.findOne({ clerkId: req.userId });

    if (!user) {
      logger.warn('updateCurrentUser: User not found in DB', { userId: req.userId });
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
    logger.info('updateCurrentUser: User updated successfully', { userId: user._id, roleChanged });

    // ✅ FIX: Update Clerk metadata if role changed or on any profile update
    if (roleChanged || role) {
      try {
        await clerkClient.users.updateUserMetadata(req.userId, {
          publicMetadata: {
            role: user.role,
            mongoId: user._id.toString()
          }
        });
        logger.info('updateCurrentUser: Clerk metadata updated');
      } catch (metadataError) {
        logger.error('updateCurrentUser: Error updating Clerk metadata:', metadataError);
        // Don't fail the request if metadata update fails
      }
    }

    res.status(200).json({
      success: true,
      user: user,  // Changed from 'data' to 'user' for consistency
      message: 'Profile updated successfully',
    });
  } catch (error) {
    logger.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Get public user profile by ID
// @route   GET /api/users/:id
// @access  Public
export const getUserById = async (req, res) => {
  try {
    logger.debug('getUserById: Fetching user with ID:', { userId: req.params.id });

    const user = await User.findById(req.params.id).select('-__v');

    if (!user) {
      logger.warn('getUserById: User not found', { userId: req.params.id });
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    logger.debug('getUserById: User found', { userId: user._id });

    res.status(200).json({
      success: true,
      user: user,  // Changed from 'data' to 'user' for consistency
    });
  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// @desc    Manually fix metadata for existing users (TEMPORARY ENDPOINT)
// @route   POST /api/users/fix-metadata
// @access  Private
// ⚠️ DEPRECATED: This endpoint should be removed in production
// It was only for debugging metadata issues
export const fixUserMetadata = async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).json({
      success: false,
      message: 'Endpoint not available in production'
    });
  }

  try {
    logger.info('fixUserMetadata: Fixing metadata for user', { userId: req.userId });

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

    logger.info('fixUserMetadata: Metadata updated successfully');

    res.status(200).json({
      success: true,
      message: 'Metadata fixed successfully',
      metadata: {
        role: user.role,
        mongoId: user._id.toString()
      }
    });
  } catch (error) {
    logger.error('Fix metadata error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fixing metadata',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};