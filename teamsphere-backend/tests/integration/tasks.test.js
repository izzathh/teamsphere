const { describe, it, expect, beforeAll, afterAll, beforeEach } = require('@jest/globals')
const request = require('supertest')
const app = require('../../src/app')
const db = require('../testDb')

process.env.JWT_ACCESS_SECRET = 'test_access_secret'
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret'
process.env.NODE_ENV = 'test'

beforeAll(async () => await db.connect())
afterAll(async () => await db.close())
beforeEach(async () => await db.clear())

const setup = async () => {
  // Create admin
  const adminRes = await request(app).post('/api/auth/register').send({
    tenantName: 'Task Corp',
    name: 'Admin',
    email: 'admin@task.com',
    password: 'Password123!',
  })
  const admin = {
    accessToken: adminRes.body.accessToken,
    tenantId: adminRes.body.tenant._id,
    userId: adminRes.body.user._id,
  }

  // Invite employee
  const empRes = await request(app)
    .post('/api/users/invite')
    .set({ Authorization: `Bearer ${admin.accessToken}`, 'X-Tenant-ID': admin.tenantId })
    .send({ name: 'Employee', email: 'emp@task.com', password: 'Password123!', role: 'employee' })

  // Login as employee
  const loginRes = await request(app).post('/api/auth/login').send({
    email: 'emp@task.com', password: 'Password123!',
  })

  const employee = {
    accessToken: loginRes.body.accessToken,
    tenantId: admin.tenantId,
    userId: empRes.body.user._id,
  }

  return { admin, employee }
}

describe('Tasks API', () => {
  let admin, employee

  beforeEach(async () => {
    const ctx = await setup()
    admin = ctx.admin
    employee = ctx.employee
  })

  const adminHeaders = () => ({
    Authorization: `Bearer ${admin.accessToken}`,
    'X-Tenant-ID': admin.tenantId,
  })

  const empHeaders = () => ({
    Authorization: `Bearer ${employee.accessToken}`,
    'X-Tenant-ID': employee.tenantId,
  })

  describe('POST /api/tasks', () => {
    it('admin can create a task', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set(adminHeaders())
        .send({ title: 'Fix bug', priority: 'high', status: 'todo' })
      expect(res.status).toBe(201)
      expect(res.body.task.title).toBe('Fix bug')
      expect(res.body.task.tenantId).toBe(admin.tenantId)
    })

    it('employee cannot create a task', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set(empHeaders())
        .send({ title: 'My task' })
      expect(res.status).toBe(403)
    })
  })

  describe('GET /api/tasks', () => {
    beforeEach(async () => {
      await request(app).post('/api/tasks').set(adminHeaders()).send({ title: 'Task A', status: 'todo' })
      await request(app).post('/api/tasks').set(adminHeaders()).send({ title: 'Task B', status: 'done' })
    })

    it('returns all tasks for the tenant', async () => {
      const res = await request(app).get('/api/tasks').set(adminHeaders())
      expect(res.status).toBe(200)
      expect(res.body.tasks).toHaveLength(2)
    })

    it('filters by status', async () => {
      const res = await request(app).get('/api/tasks?status=todo').set(adminHeaders())
      expect(res.body.tasks).toHaveLength(1)
      expect(res.body.tasks[0].title).toBe('Task A')
    })

    it('employee can list tasks', async () => {
      const res = await request(app).get('/api/tasks').set(empHeaders())
      expect(res.status).toBe(200)
    })

    it('returns overdue tasks when overdue=true', async () => {
      const pastDate = new Date('2020-01-01').toISOString()
      await request(app)
        .post('/api/tasks')
        .set(adminHeaders())
        .send({ title: 'Overdue task', dueDate: pastDate, status: 'todo' })

      const res = await request(app).get('/api/tasks?overdue=true').set(adminHeaders())
      expect(res.body.tasks.length).toBeGreaterThanOrEqual(1)
      expect(res.body.tasks.every((t) => t.status !== 'done')).toBe(true)
    })
  })

  describe('PATCH /api/tasks/:id/status', () => {
    let taskId

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set(adminHeaders())
        .send({ title: 'Status Test Task', status: 'todo' })
      taskId = res.body.task._id
    })

    it('employee can update task status', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${taskId}/status`)
        .set(empHeaders())
        .send({ status: 'in_progress' })
      expect(res.status).toBe(200)
      expect(res.body.task.status).toBe('in_progress')
    })

    it('returns 400 for invalid status', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${taskId}/status`)
        .set(empHeaders())
        .send({ status: 'not_a_status' })
      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/tasks/:id/comments', () => {
    let taskId

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set(adminHeaders())
        .send({ title: 'Comment test' })
      taskId = res.body.task._id
    })

    it('any role can add a comment', async () => {
      const res = await request(app)
        .post(`/api/tasks/${taskId}/comments`)
        .set(empHeaders())
        .send({ comment: 'Great work!' })
      expect(res.status).toBe(201)
      expect(res.body.task.comments).toHaveLength(1)
      expect(res.body.task.comments[0].text).toBe('Great work!')
    })
  })

  describe('DELETE /api/tasks/:id', () => {
    it('employee cannot delete a task', async () => {
      const createRes = await request(app)
        .post('/api/tasks')
        .set(adminHeaders())
        .send({ title: 'To protect' })
      const taskId = createRes.body.task._id

      const res = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set(empHeaders())
      expect(res.status).toBe(403)
    })

    it('admin can soft-delete a task', async () => {
      const createRes = await request(app)
        .post('/api/tasks')
        .set(adminHeaders())
        .send({ title: 'To delete' })
      const taskId = createRes.body.task._id

      const res = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set(adminHeaders())
      expect(res.status).toBe(200)

      const getRes = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set(adminHeaders())
      expect(getRes.status).toBe(404)
    })
  })
})
