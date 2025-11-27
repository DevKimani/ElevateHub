// server/src/middleware/validation.js
import { body, param, query, validationResult } from 'express-validator';

/**
 * Middleware to check validation results
 */
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  next();
};

/**
 * Job validation rules
 */
export const jobValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 10, max: 100 })
    .withMessage('Title must be between 10 and 100 characters'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 50, max: 5000 })
    .withMessage('Description must be between 50 and 5000 characters'),
  
  body('budget')
    .isFloat({ min: 100 })
    .withMessage('Budget must be at least KES 100'),
  
  body('category')
    .isIn(['Web Development', 'Mobile Development', 'Design', 'Writing', 'Marketing', 'Data Entry', 'Virtual Assistant', 'Other'])
    .withMessage('Invalid category'),
  
  body('deadline')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      const deadline = new Date(value);
      const today = new Date();
      if (deadline < today) {
        throw new Error('Deadline must be in the future');
      }
      return true;
    }),
  
  validateRequest
];

/**
 * Job update validation (all fields optional)
 */
export const jobUpdateValidation = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 10, max: 100 })
    .withMessage('Title must be between 10 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 50, max: 5000 })
    .withMessage('Description must be between 50 and 5000 characters'),
  
  body('budget')
    .optional()
    .isFloat({ min: 100 })
    .withMessage('Budget must be at least KES 100'),
  
  body('category')
    .optional()
    .isIn(['Web Development', 'Mobile Development', 'Design', 'Writing', 'Marketing', 'Data Entry', 'Virtual Assistant', 'Other'])
    .withMessage('Invalid category'),
  
  body('status')
    .optional()
    .isIn(['open', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  
  validateRequest
];

/**
 * Application validation rules
 */
export const applicationValidation = [
  body('job')
    .notEmpty()
    .withMessage('Job ID is required')
    .isMongoId()
    .withMessage('Invalid job ID'),
  
  body('coverLetter')
    .trim()
    .notEmpty()
    .withMessage('Cover letter is required')
    .isLength({ min: 100, max: 2000 })
    .withMessage('Cover letter must be between 100 and 2000 characters'),
  
  body('proposedBudget')
    .isFloat({ min: 1 })
    .withMessage('Proposed budget must be a positive number'),
  
  body('estimatedDuration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Estimated duration must be at least 1 day'),
  
  validateRequest
];

/**
 * Application status update validation
 */
export const applicationStatusValidation = [
  body('status')
    .isIn(['pending', 'accepted', 'rejected'])
    .withMessage('Status must be pending, accepted, or rejected'),
  
  body('rejectionReason')
    .if(body('status').equals('rejected'))
    .notEmpty()
    .withMessage('Rejection reason is required when rejecting an application'),
  
  validateRequest
];

/**
 * Work submission validation
 */
export const workSubmissionValidation = [
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Submission description is required')
    .isLength({ min: 50, max: 2000 })
    .withMessage('Description must be between 50 and 2000 characters'),
  
  body('attachments')
    .optional()
    .isArray()
    .withMessage('Attachments must be an array'),
  
  body('attachments.*.url')
    .optional()
    .isURL()
    .withMessage('Invalid attachment URL'),
  
  body('attachments.*.filename')
    .optional()
    .notEmpty()
    .withMessage('Attachment filename is required'),
  
  validateRequest
];

/**
 * Work review validation
 */
export const workReviewValidation = [
  body('status')
    .isIn(['approved', 'revision_requested'])
    .withMessage('Status must be approved or revision_requested'),
  
  body('reviewNotes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Review notes must not exceed 1000 characters'),
  
  body('reviewNotes')
    .if(body('status').equals('revision_requested'))
    .notEmpty()
    .withMessage('Review notes are required when requesting revisions'),
  
  validateRequest
];

/**
 * Message validation
 */
export const messageValidation = [
  body('receiverId')
    .notEmpty()
    .withMessage('Receiver ID is required')
    .isMongoId()
    .withMessage('Invalid receiver ID'),
  
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Message content is required')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message must be between 1 and 2000 characters'),
  
  validateRequest
];

/**
 * Transaction validation
 */
export const transactionValidation = [
  body('jobId')
    .notEmpty()
    .withMessage('Job ID is required')
    .isMongoId()
    .withMessage('Invalid job ID'),
  
  body('amount')
    .isFloat({ min: 100 })
    .withMessage('Amount must be at least KES 100'),
  
  body('type')
    .isIn(['escrow_deposit', 'payment_release', 'refund'])
    .withMessage('Invalid transaction type'),
  
  validateRequest
];

/**
 * User profile update validation
 */
export const profileUpdateValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Bio must not exceed 500 characters'),
  
  body('skills')
    .optional()
    .isArray()
    .withMessage('Skills must be an array'),
  
  body('skills.*')
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Each skill must be between 2 and 30 characters'),
  
  body('hourlyRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Hourly rate must be a positive number'),
  
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location must not exceed 100 characters'),
  
  body('phoneNumber')
    .optional()
    .trim()
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Invalid phone number format'),
  
  validateRequest
];

/**
 * Pagination validation
 */
export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  validateRequest
];

/**
 * MongoDB ID parameter validation
 */
export const mongoIdValidation = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  
  validateRequest
];

/**
 * Search validation
 */
export const searchValidation = [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search query must be between 2 and 100 characters'),
  
  query('category')
    .optional()
    .isIn(['all', 'Web Development', 'Mobile Development', 'Design', 'Writing', 'Marketing', 'Data Entry', 'Virtual Assistant', 'Other'])
    .withMessage('Invalid category'),
  
  query('minBudget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Minimum budget must be a positive number'),
  
  query('maxBudget')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Maximum budget must be a positive number'),
  
  query('status')
    .optional()
    .isIn(['all', 'open', 'in_progress', 'completed', 'cancelled'])  // ✅ FIXED: Added 'all'
    .withMessage('Invalid status'),
  
  query('experienceLevel')
    .optional()
    .isIn(['all', 'entry', 'intermediate', 'expert', 'any'])
    .withMessage('Invalid experience level'),
  
  validateRequest
];