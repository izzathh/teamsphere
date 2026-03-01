const swaggerJsdoc = require('swagger-jsdoc')

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'TeamSphere API',
      version: '1.0.0',
      description:
        'Multi-Tenant SaaS Project Management API. All authenticated endpoints require `Authorization: Bearer <token>` and `X-Tenant-ID: <tenantId>` headers.',
      contact: { name: 'TeamSphere', email: 'api@teamsphere.io' },
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      parameters: {
        TenantID: {
          in: 'header',
          name: 'X-Tenant-ID',
          required: true,
          schema: { type: 'string' },
          description: 'Tenant identifier for multi-tenant isolation',
        },
      },
      schemas: {
        Tenant: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '6571abc123def456' },
            name: { type: 'string', example: 'Acme Inc.' },
            plan: { type: 'string', example: 'free' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Jane Smith' },
            email: { type: 'string', format: 'email', example: 'jane@acme.com' },
            role: { type: 'string', enum: ['admin', 'manager', 'employee'] },
            tenantId: { type: 'string' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Project: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Website Redesign' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['active', 'on_hold', 'completed', 'archived'] },
            members: { type: 'array', items: { $ref: '#/components/schemas/User' } },
            tenantId: { type: 'string' },
            createdBy: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Task: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string', example: 'Design landing page' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['todo', 'in_progress', 'done', 'on_hold'] },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
            assignedTo: { $ref: '#/components/schemas/User' },
            projectId: { $ref: '#/components/schemas/Project' },
            dueDate: { type: 'string', format: 'date-time' },
            isOverdue: { type: 'boolean' },
            comments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: { type: 'string' },
                  author: { $ref: '#/components/schemas/User' },
                  createdAt: { type: 'string', format: 'date-time' },
                },
              },
            },
            tenantId: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        DashboardStats: {
          type: 'object',
          properties: {
            totalProjects: { type: 'integer', example: 12 },
            activeProjects: { type: 'integer', example: 8 },
            totalTasks: { type: 'integer', example: 57 },
            overdueCount: { type: 'integer', example: 4 },
            tasksByStatus: {
              type: 'object',
              properties: {
                todo: { type: 'integer' },
                in_progress: { type: 'integer' },
                done: { type: 'integer' },
                on_hold: { type: 'integer' },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: { type: 'array', items: { type: 'object' } },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array' },
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
      },
    },
    security: [{ BearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
}

module.exports = swaggerJsdoc(options)
