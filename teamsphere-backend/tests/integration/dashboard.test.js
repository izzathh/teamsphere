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

describe('Dashboard API', () => {
  let auth

  beforeEach(async () => {
    const res = await request(app).post('/api/auth/register').send({
      tenantName: 'Dash Corp',
      name: 'Admin',
      email: 'admin@dash.com',
      password: 'Password123!',
    })
    auth = {
      accessToken: res.body.accessToken,
      tenantId: res.body.tenant._id,
    }

    const headers = {
      Authorization: `Bearer ${auth.accessToken}`,
      'X-Tenant-ID': auth.tenantId,
    }

    // Create some projects
    await request(app).post('/api/projects').set(headers).send({ name: 'P1', status: 'active' })
    await request(app).post('/api/projects').set(headers).send({ name: 'P2', status: 'active' })
    await request(app).post('/api/projects').set(headers).send({ name: 'P3', status: 'completed' })

    // Create some tasks
    await request(app).post('/api/tasks').set(headers).send({ title: 'T1', status: 'todo' })
    await request(app).post('/api/tasks').set(headers).send({ title: 'T2', status: 'todo' })
    await request(app).post('/api/tasks').set(headers).send({ title: 'T3', status: 'in_progress' })
    await request(app).post('/api/tasks').set(headers).send({ title: 'T4', status: 'done' })
    // Overdue task
    await request(app).post('/api/tasks').set(headers).send({
      title: 'T5 Overdue',
      status: 'todo',
      dueDate: new Date('2020-01-01').toISOString(),
    })
  })

  it('returns correct aggregate stats', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set({
        Authorization: `Bearer ${auth.accessToken}`,
        'X-Tenant-ID': auth.tenantId,
      })

    expect(res.status).toBe(200)
    expect(res.body.totalProjects).toBe(3)
    expect(res.body.activeProjects).toBe(2)
    expect(res.body.totalTasks).toBe(5)
    expect(res.body.tasksByStatus.todo).toBe(3) // T1, T2, T5
    expect(res.body.tasksByStatus.in_progress).toBe(1)
    expect(res.body.tasksByStatus.done).toBe(1)
    expect(res.body.overdueCount).toBe(1)
  })

  it('requires authentication', async () => {
    const res = await request(app).get('/api/dashboard/stats')
    expect(res.status).toBe(401)
  })
})
