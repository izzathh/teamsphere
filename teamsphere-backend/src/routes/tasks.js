const express = require('express')
const router = express.Router()
const {
  listTasks, createTask, getTask, updateTask,
  updateTaskStatus, addComment, deleteTask,
} = require('../controllers/taskController')
const { authenticate } = require('../middleware/authenticate')
const { requireTenant } = require('../middleware/tenant')
const { authorize } = require('../middleware/authorize')
const {
  taskRules, statusUpdateRules, commentRules, paginationRules, mongoIdParam, validate,
} = require('../validators')

router.use(authenticate, requireTenant)

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task management
 */

/**
 * @swagger
 * /tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: List tasks with filtering and pagination
 *     parameters:
 *       - $ref: '#/components/parameters/TenantID'
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 12 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [todo, in_progress, done, on_hold] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [low, medium, high, critical] }
 *       - in: query
 *         name: projectId
 *         schema: { type: string }
 *       - in: query
 *         name: assignedTo
 *         schema: { type: string }
 *       - in: query
 *         name: overdue
 *         schema: { type: boolean }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated tasks list
 */
router.get('/', paginationRules, validate, listTasks)

/**
 * @swagger
 * /tasks:
 *   post:
 *     tags: [Tasks]
 *     summary: Create a task (Admin/Manager)
 *     parameters:
 *       - $ref: '#/components/parameters/TenantID'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title: { type: string }
 *               description: { type: string }
 *               status: { type: string, enum: [todo, in_progress, done, on_hold] }
 *               priority: { type: string, enum: [low, medium, high, critical] }
 *               assignedTo: { type: string }
 *               projectId: { type: string }
 *               dueDate: { type: string, format: date }
 *     responses:
 *       201:
 *         description: Task created
 */
router.post('/', authorize('admin', 'manager'), taskRules, validate, createTask)

/**
 * @swagger
 * /tasks/{id}:
 *   get:
 *     tags: [Tasks]
 *     summary: Get task by ID
 *     parameters:
 *       - $ref: '#/components/parameters/TenantID'
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Task details
 */
router.get('/:id', mongoIdParam(), validate, getTask)

/**
 * @swagger
 * /tasks/{id}:
 *   put:
 *     tags: [Tasks]
 *     summary: Full task update (Admin/Manager only)
 *     parameters:
 *       - $ref: '#/components/parameters/TenantID'
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Task updated
 */
router.put('/:id', authorize('admin', 'manager'), mongoIdParam(), taskRules, validate, updateTask)

/**
 * @swagger
 * /tasks/{id}/status:
 *   patch:
 *     tags: [Tasks]
 *     summary: Update task status (all roles)
 *     parameters:
 *       - $ref: '#/components/parameters/TenantID'
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: string, enum: [todo, in_progress, done, on_hold] }
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/:id/status', mongoIdParam(), statusUpdateRules, validate, updateTaskStatus)

/**
 * @swagger
 * /tasks/{id}/comments:
 *   post:
 *     tags: [Tasks]
 *     summary: Add a comment to a task (all roles)
 *     parameters:
 *       - $ref: '#/components/parameters/TenantID'
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [comment]
 *             properties:
 *               comment: { type: string }
 *     responses:
 *       201:
 *         description: Comment added
 */
router.post('/:id/comments', mongoIdParam(), commentRules, validate, addComment)

/**
 * @swagger
 * /tasks/{id}:
 *   delete:
 *     tags: [Tasks]
 *     summary: Soft-delete a task (Admin/Manager only)
 *     parameters:
 *       - $ref: '#/components/parameters/TenantID'
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Task deleted
 */
router.delete('/:id', authorize('admin', 'manager'), mongoIdParam(), validate, deleteTask)

module.exports = router
