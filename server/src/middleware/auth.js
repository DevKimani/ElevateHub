import { createClerkClient, verifyToken } from '@clerk/backend';

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY
});

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    console.log('Auth middleware: CLERK_SECRET_KEY set:', !!process.env.CLERK_SECRET_KEY);
    console.log('Auth middleware: received Authorization header:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'No authentication token provided' 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('Auth middleware: token extracted, length:', token.length);

    try {
      // Use the standalone verifyToken function from @clerk/backend
      const sessionClaims = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
        // Optional: specify authorized parties if needed
        // authorizedParties: ['https://elevatehubportal.vercel.app']
      });
      
      console.log('Auth middleware: token verified, userId:', sessionClaims.sub);
      
      // Attach user ID to request
      req.userId = sessionClaims.sub;
      next();
    } catch (verifyError) {
      console.error('Token verification failed:', verifyError.message);
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid or expired token',
        error: process.env.NODE_ENV === 'development' ? verifyError.message : undefined
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Authentication failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      
      try {
        const sessionClaims = await verifyToken(token, {
          secretKey: process.env.CLERK_SECRET_KEY,
        });
        
        if (sessionClaims && sessionClaims.sub) {
          req.userId = sessionClaims.sub;
          console.log('Optional auth: userId set:', sessionClaims.sub);
        }
      } catch (error) {
        // Continue without auth if token is invalid
        console.log('Optional auth: token verification failed, continuing without auth');
      }
    }
    next();
  } catch (error) {
    // Continue without auth on any error
    console.log('Optional auth error:', error.message);
    next();
  }
};