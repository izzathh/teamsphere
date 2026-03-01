const express = require('express')
const router = express.Router()
const { getStats } = require('../controllers/dashboardController')
const { authenticate } = require('../middleware/authenticate')
const { requireTenant } = require('../middleware/tenant')

router.use(authenticate, requireTenant)

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Analytics and aggregated stats
 */

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get aggregated workspace stats
 *     description: Returns total projects, total tasks, tasks by status, and overdue count using MongoDB aggregation pipeline.
 *     parameters:
 *       - $ref: '#/components/parameters/TenantID'
 *     responses:
 *       200:
 *         description: Dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardStats'
 */
router.get('/stats', getStats)

module.exports = router
