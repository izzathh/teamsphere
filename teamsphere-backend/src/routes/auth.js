const express = require('express')
const router = express.Router()
const {
  register,
  login,
  refresh,
  me,
  validateEmail
} = require('../controllers/authController')
const {
  authenticate
} = require('../middleware/authenticate')
const {
  registerRules,
  loginRules,
  refreshRules,
  validate,
  emailValidateRules,
} = require('../validators')
const rateLimit = require('express-rate-limit')

// Rate limit login endpoint
const loginLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 10,
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
})

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new organization (tenant) and admin user
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tenantName, name, email, password]
 *             properties:
 *               tenantName:
 *                 type: string
 *                 example: Acme Inc.
 *               name:
 *                 type: string
 *                 example: Jane Smith
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane@acme.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: Secret123!
 *     responses:
 *       201:
 *         description: Workspace created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 accessToken: { type: string }
 *                 refreshToken: { type: string }
 *                 user: { $ref: '#/components/schemas/User' }
 *                 tenant: { $ref: '#/components/schemas/Tenant' }
 *       400:
 *         $ref: '#/components/schemas/Error'
 */
router.post('/register', registerRules, validate, register)

/**
 * @swagger
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email + password
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: jane@acme.com
 *               password:
 *                 type: string
 *                 example: Secret123!
 *     responses:
 *       200:
 *         description: Login successful — returns access + refresh tokens
 *       401:
 *         description: Invalid credentials
 *       429:
 *         description: Too many attempts
 */
router.post('/login', loginLimiter, loginRules, validate, login)

/**
 * @swagger
 * /auth/validate-email:
 *   post:
 *     tags: [Auth]
 *     summary: Validate with email
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 example: jane@acme.com
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/validate-email', emailValidateRules, validate, validateEmail)

/**
 * @swagger
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Get a new access token using refresh token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: New access token
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', refreshRules, validate, refresh)

/**
 * @swagger
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current authenticated user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Current user
 */
router.get('/me', authenticate, me)

module.exports = router