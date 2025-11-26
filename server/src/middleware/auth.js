// server/src/middleware/auth.js
import { createClerkClient, verifyToken } from '@clerk/backend';

// Initialize Clerk client once (not on every request)
const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
});

/**
 * Required authentication middleware
 * Verifies JWT token and attaches userId to request
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    // Enhanced logging for development
    if (process.env.NODE_ENV === 'development') {
      console.log('Auth middleware: CLERK_SECRET_KEY set:', !!process.env.CLERK_SECRET_KEY);
      console.log('Auth middleware: received Authorization header:', !!authHeader);
    }
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'No authentication token provided' 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Auth middleware: token extracted, length:', token.length);
    }

    try {
      // Verify token with proper configuration
      const sessionClaims = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
        // Add issuer validation for production security
        issuer: (iss) => iss.startsWith('https://'),
        // Specify authorized parties (your frontend domains)
        authorizedParties: [
          'http://localhost:5173',
          'https://elevatehubportal.vercel.app'
        ]
      });
      
      if (!sessionClaims || !sessionClaims.sub) {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid token claims' 
        });
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Auth middleware: token verified, userId:', sessionClaims.sub);
      }
      
      // Attach user ID and full session claims to request
      req.userId = sessionClaims.sub;
      req.sessionClaims = sessionClaims;
      
      next();
    } catch (verifyError) {
      console.error('Token verification failed:', verifyError.message);
      
      // Handle specific error types
      if (verifyError.message.includes('expired')) {
        return res.status(401).json({ 
          success: false, 
          message: 'Token has expired. Please sign in again.',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired token',
        code: 'TOKEN_INVALID',
        error: process.env.NODE_ENV === 'development' ? verifyError.message : undefined
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Authentication service error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Optional authentication middleware
 * Attaches userId if valid token exists, but doesn't block request
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      
      try {
        const sessionClaims = await verifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY,
          issuer: (iss) => iss.startsWith('https://'),
          authorizedParties: [
            'http://localhost:5173',
            'https://elevatehubportal.vercel.app'
          ]
        });
        
        if (sessionClaims && sessionClaims.sub) {
          req.userId = sessionClaims.sub;
          req.sessionClaims = sessionClaims;
          
          if (process.env.NODE_ENV === 'development') {
            console.log('Optional auth: userId set:', sessionClaims.sub);
          }
        }
      } catch (error) {
        // Silently continue without auth if token is invalid
        if (process.env.NODE_ENV === 'development') {
          console.log('Optional auth: token verification failed, continuing without auth');
        }
      }
    }
    next();
  } catch (error) {
    // Continue without auth on any error
    if (process.env.NODE_ENV === 'development') {
      console.log('Optional auth error:', error.message);
    }
    next();
  }
};

/**
 * Role-based authorization middleware
 * Use after requireAuth to check user role
 */
export const requireRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Dynamically import to avoid circular dependencies
      const User = (await import('../models/User.js')).default;
      const user = await User.findOne({ clerkId: req.userId });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Check if user has required role
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${allowedRoles.join(' or ')}`
        });
      }

      // Attach user to request for convenience
      req.user = user;
      next();
    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({
        success: false,
        message: 'Authorization check failed'
      });
    }
  };
};

// Export clerkClient for use in other parts of the application
export { clerkClient };