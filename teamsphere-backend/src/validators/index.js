const {
  body,
  query,
  param,
  validationResult
} = require('express-validator')
const {
  sendError
} = require('../utils/response')

const validate = (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 400, errors.array())
  }
  next()
}

const registerRules = [
  body('tenantName')
  .trim()
  .notEmpty().withMessage('Organization name is required')
  .isLength({
    min: 2,
    max: 100
  }).withMessage('Organization name must be 2–100 characters'),
  body('name')
  .trim()
  .notEmpty().withMessage('Name is required')
  .isLength({
    min: 2,
    max: 100
  }).withMessage('Name must be 2–100 characters'),
  body('email')
  .trim()
  .notEmpty().withMessage('Email is required')
  .isEmail().withMessage('Invalid email format')
  .normalizeEmail(),
  body('password')
  .isLength({
    min: 8
  }).withMessage('Password must be at least 8 characters'),
]

const emailValidateRules = [
  body('email')
  .trim()
  .notEmpty().withMessage('Email is required')
  .isEmail().withMessage('Invalid email format')
  .normalizeEmail()
]

const loginRules = [
  body('email')
  .trim()
  .notEmpty().withMessage('Email is required')
  .isEmail().withMessage('Invalid email format')
  .normalizeEmail(),
  body('password')
  .notEmpty().withMessage('Password is required'),
]

const refreshRules = [
  body('refreshToken')
  .notEmpty().withMessage('Refresh token is required'),
]

const projectRules = [
  body('name')
  .trim()
  .notEmpty().withMessage('Project name is required')
  .isLength({
    min: 2,
    max: 200
  }).withMessage('Name must be 2–200 characters'),
  body('description')
  .optional()
  .trim()
  .isLength({
    max: 2000
  }).withMessage('Description too long'),
  body('status')
  .optional()
  .isIn(['active', 'on_hold', 'completed', 'archived']).withMessage('Invalid status'),
  body('members')
  .optional()
  .isArray().withMessage('Members must be an array'),
  body('members.*')
  .optional()
  .isMongoId().withMessage('Invalid member ID'),
]

const taskRules = [
  body('title')
  .trim()
  .notEmpty().withMessage('Title is required')
  .isLength({
    min: 2,
    max: 300
  }).withMessage('Title must be 2–300 characters'),
  body('description')
  .optional()
  .trim()
  .isLength({
    max: 5000
  }).withMessage('Description too long'),
  body('status')
  .optional()
  .isIn(['todo', 'in_progress', 'done', 'on_hold']).withMessage('Invalid status'),
  body('priority')
  .optional()
  .isIn(['low', 'medium', 'high', 'critical']).withMessage('Invalid priority'),
  body('assignedTo')
  .optional({
    nullable: true
  })
  .isMongoId().withMessage('Invalid user ID'),
  body('projectId')
  .optional({
    nullable: true
  })
  .isMongoId().withMessage('Invalid project ID'),
  body('dueDate')
  .optional({
    nullable: true
  })
  .isISO8601().withMessage('Invalid date format'),
]

const statusUpdateRules = [
  body('status')
  .notEmpty().withMessage('Status is required')
  .isIn(['todo', 'in_progress', 'done', 'on_hold']).withMessage('Invalid status'),
]

const commentRules = [
  body('comment')
  .trim()
  .notEmpty().withMessage('Comment text is required')
  .isLength({
    max: 1000
  }).withMessage('Comment too long'),
]

const inviteUserRules = [
  body('name')
  .trim()
  .notEmpty().withMessage('Name is required')
  .isLength({
    min: 2,
    max: 100
  }).withMessage('Name must be 2–100 characters'),
  body('email')
  .trim()
  .notEmpty().withMessage('Email is required')
  .isEmail().withMessage('Invalid email format')
  .normalizeEmail(),
  body('role')
  .optional()
  .isIn(['manager', 'employee']).withMessage('Role must be manager or employee'),
  body('password')
  .isLength({
    min: 8
  }).withMessage('Password must be at least 8 characters'),
]

const updateUserRules = [
  body('name')
  .optional()
  .trim()
  .isLength({
    min: 2,
    max: 100
  }).withMessage('Name must be 2–100 characters'),
  body('role')
  .optional()
  .isIn(['admin', 'manager', 'employee']).withMessage('Invalid role'),
  body('password')
  .optional()
  .isLength({
    min: 8
  }).withMessage('Password must be at least 8 characters'),
]

const paginationRules = [
  query('page')
  .optional()
  .isInt({
    min: 1
  }).withMessage('Page must be a positive integer')
  .toInt(),
  query('limit')
  .optional()
  .isInt({
    min: 1,
    max: 100
  }).withMessage('Limit must be between 1 and 100')
  .toInt(),
]

const mongoIdParam = (paramName = 'id') => [
  param(paramName)
  .isMongoId().withMessage(`Invalid ${paramName}`),
]

module.exports = {
  validate,
  registerRules,
  loginRules,
  emailValidateRules,
  refreshRules,
  projectRules,
  taskRules,
  statusUpdateRules,
  commentRules,
  inviteUserRules,
  updateUserRules,
  paginationRules,
  mongoIdParam,
}