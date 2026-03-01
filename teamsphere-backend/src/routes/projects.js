const express = require('express')
const router = express.Router()
const {
  listProjects, createProject, getProject, updateProject, deleteProject,
} = require('../controllers/projectController')
const { authenticate } = require('../middleware/authenticate')
const { requireTenant } = require('../middleware/tenant')
const { authorize } = require('../middleware/authorize')
const {
  projectRules, paginationRules, mongoIdParam, validate,
} = require('../validators')

// All project routes require auth + tenant context
router.use(authenticate, requireTenant)

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project management
 */

/**
 * @swagger
 * /projects:
 *   get:
 *     tags: [Projects]
 *     summary: List projects (paginated + filtered)
 *     parameters:
 *       - $ref: '#/components/parameters/TenantID'
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *       - in: query
 *         name: status
 *         schema: { type: string, enum: [active, on_hold, completed, archived] }
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Paginated list of projects
 */
router.get('/', paginationRules, validate, listProjects)

/**
 * @swagger
 * /projects:
 *   post:
 *     tags: [Projects]
 *     summary: Create a new project (Admin/Manager only)
 *     parameters:
 *       - $ref: '#/components/parameters/TenantID'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               status: { type: string, enum: [active, on_hold, completed, archived] }
 *               members: { type: array, items: { type: string } }
 *     responses:
 *       201:
 *         description: Project created
 *       403:
 *         description: Insufficient role
 */
router.post('/', authorize('admin', 'manager'), projectRules, validate, createProject)

/**
 * @swagger
 * /projects/{id}:
 *   get:
 *     tags: [Projects]
 *     summary: Get a project by ID
 *     parameters:
 *       - $ref: '#/components/parameters/TenantID'
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Project details
 *       404:
 *         description: Not found
 */
router.get('/:id', mongoIdParam(), validate, getProject)

/**
 * @swagger
 * /projects/{id}:
 *   put:
 *     tags: [Projects]
 *     summary: Update a project (Admin/Manager only)
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
 *               description: { type: string }
 *               status: { type: string }
 *               members: { type: array, items: { type: string } }
 *     responses:
 *       200:
 *         description: Project updated
 */
router.put('/:id', authorize('admin', 'manager'), mongoIdParam(), projectRules, validate, updateProject)

/**
 * @swagger
 * /projects/{id}:
 *   delete:
 *     tags: [Projects]
 *     summary: Soft-delete a project (Admin/Manager only)
 *     parameters:
 *       - $ref: '#/components/parameters/TenantID'
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Deleted
 */
router.delete('/:id', authorize('admin', 'manager'), mongoIdParam(), validate, deleteProject)

module.exports = router
