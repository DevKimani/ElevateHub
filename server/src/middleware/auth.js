import { clerkClient } from '@clerk/clerk-sdk-node';

export const requireAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    console.log('Auth middleware: CLERK_SECRET_KEY set:', !!process.env.CLERK_SECRET_KEY);
    console.log('Auth middleware: received Authorization header:', !!req.headers.authorization);
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No authentication token provided' 
      });
    }

    // Verify the token with Clerk
    const payload = await clerkClient.verifyToken(token);
    console.log('Auth middleware: token verified payload present:', !!payload);
    
    if (!payload) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }

    // Attach user ID to request
    req.userId = payload.sub;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Authentication failed' 
    });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      const payload = await clerkClient.verifyToken(token);
      if (payload) {
        req.userId = payload.sub;
      }
    }
    next();
  } catch (error) {
    // Continue without auth
    next();
  }
};