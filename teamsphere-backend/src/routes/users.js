const express = require('express')
const router = express.Router()
const {
  listUsers,
  getUser,
  inviteUser,
  updateUser,
  deleteUser
} = require('../controllers/userController')
const {
  authenticate
} = require('../middleware/authenticate')
const {
  requireTenant
} = require('../middleware/tenant')
const {
  authorize
} = require('../middleware/authorize')
const {
  inviteUserRules,
  updateUserRules,
  paginationRules,
  mongoIdParam,
  validate,
} = require('../validators')

router.use(authenticate, requireTenant)

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Team member management
 */

/**
 * @swagger
 * /users:
 *   get:
 *     tags: [Users]
 *     summary: List team members (Admin/Manager)
 *     parameters:
 *       - $ref: '#/components/parameters/TenantID'
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [admin, manager, employee] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/', authorize('admin', 'manager'), paginationRules, validate, listUsers)

/**
 * @swagger
 * /users/invite:
 *   post:
 *     tags: [Users]
 *     summary: Invite a new team member (Admin only)
 *     parameters:
 *       - $ref: '#/components/parameters/TenantID'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               role: { type: string, enum: [manager, employee] }
 *               password: { type: string }
 *     responses:
 *       201:
 *         description: User invited
 *       409:
 *         description: Email already exists
 */
router.post('/invite', authorize('admin'), inviteUserRules, validate, inviteUser)

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     parameters:
 *       - $ref: '#/components/parameters/TenantID'
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User details
 */
router.get('/:id', authorize('admin', 'manager'), mongoIdParam(), validate, getUser)

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: Update user profile or role
 *     parameters:
 *       - $ref: '#/components/parameters/TenantID'
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               role: { type: string }
 *               password: { type: string }
 *               currentPassword: { type: string }
 *     responses:
 *       200:
 *         description: User updated
 */
router.put('/:id', mongoIdParam(), updateUserRules, validate, updateUser)

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Remove a team member (Admin only)
 *     parameters:
 *       - $ref: '#/components/parameters/TenantID'
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: User removed
 */
router.delete('/:id', authorize('admin'), mongoIdParam(), validate, deleteUser)

module.exports = router