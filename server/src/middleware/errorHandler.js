// server/src/middleware/errorHandler.js

/**
 * Centralized error handling middleware
 * Must be placed LAST in middleware chain
 */
export const errorHandler = (err, req, res, next) => {
  // Log error for debugging
  console.error('Error occurred:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Default error
  let error = {
    success: false,
    message: err.message || 'Internal server error',
    statusCode: err.statusCode || 500
  };

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    error.statusCode = 400;
    error.message = 'Validation Error';
    error.errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    error.statusCode = 409;
    error.message = 'Duplicate entry';
    const field = Object.keys(err.keyPattern)[0];
    error.field = field;
    error.errors = [{
      field: field,
      message: `${field} already exists`
    }];
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    error.statusCode = 400;
    error.message = `Invalid ${err.path}: ${err.value}`;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.statusCode = 401;
    error.message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    error.statusCode = 401;
    error.message = 'Token has expired';
    error.code = 'TOKEN_EXPIRED';
  }

  // Clerk errors
  if (err.message && err.message.includes('Clerk')) {
    error.statusCode = 401;
    error.message = 'Authentication failed';
  }

  // File upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    error.statusCode = 413;
    error.message = 'File too large';
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error.statusCode = 400;
    error.message = 'Unexpected file field';
  }

  // Send error response
  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    ...(error.errors && { errors: error.errors }),
    ...(error.field && { field: error.field }),
    ...(error.code && { code: error.code }),
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      originalError: err.message
    })
  });
};

/**
 * Async handler wrapper to catch async errors
 * Use this to wrap async route handlers
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Not Found handler
 * Place this BEFORE errorHandler
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

/**
 * Custom error class for application-specific errors
 */
export class AppError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}