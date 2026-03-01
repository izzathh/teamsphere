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

// Helper: register and get tokens + tenantId
const setup = async (tenantName = 'Proj Corp', email = 'admin@proj.com') => {
  const res = await request(app).post('/api/auth/register').send({
    tenantName,
    name: 'Admin',
    email,
    password: 'Password123!',
  })
  return {
    accessToken: res.body.accessToken,
    tenantId: res.body.tenant._id,
    userId: res.body.user._id,
  }
}

describe('Projects API', () => {
  let auth

  beforeEach(async () => {
    auth = await setup()
  })

  const authHeaders = () => ({
    Authorization: `Bearer ${auth.accessToken}`,
    'X-Tenant-ID': auth.tenantId,
  })

  describe('POST /api/projects', () => {
    it('creates a project as admin', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set(authHeaders())
        .send({ name: 'My Project', description: 'Test project' })

      expect(res.status).toBe(201)
      expect(res.body.project.name).toBe('My Project')
      expect(res.body.project.tenantId).toBe(auth.tenantId)
    })

    it('returns 400 for missing name', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set(authHeaders())
        .send({ description: 'No name' })
      expect(res.status).toBe(400)
    })

    it('returns 401 without auth', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('X-Tenant-ID', auth.tenantId)
        .send({ name: 'Test' })
      expect(res.status).toBe(401)
    })

    it('returns 400 without X-Tenant-ID', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${auth.accessToken}`)
        .send({ name: 'Test' })
      expect(res.status).toBe(400)
    })
  })

  describe('GET /api/projects', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/projects')
        .set(authHeaders())
        .send({ name: 'Project Alpha', status: 'active' })
      await request(app)
        .post('/api/projects')
        .set(authHeaders())
        .send({ name: 'Project Beta', status: 'on_hold' })
    })

    it('lists all projects for tenant', async () => {
      const res = await request(app).get('/api/projects').set(authHeaders())
      expect(res.status).toBe(200)
      expect(res.body.projects).toHaveLength(2)
      expect(res.body.total).toBe(2)
    })

    it('filters by status', async () => {
      const res = await request(app)
        .get('/api/projects?status=active')
        .set(authHeaders())
      expect(res.body.projects).toHaveLength(1)
      expect(res.body.projects[0].name).toBe('Project Alpha')
    })

    it('paginates results', async () => {
      const res = await request(app)
        .get('/api/projects?limit=1&page=1')
        .set(authHeaders())
      expect(res.body.projects).toHaveLength(1)
      expect(res.body.totalPages).toBe(2)
    })

    it('does not expose projects from other tenants', async () => {
      // Create second tenant
      const auth2 = await setup('Other Corp', 'admin@other.com')
      await request(app)
        .post('/api/projects')
        .set({ Authorization: `Bearer ${auth2.accessToken}`, 'X-Tenant-ID': auth2.tenantId })
        .send({ name: 'Other Project' })

      // First tenant still only sees 2 projects
      const res = await request(app).get('/api/projects').set(authHeaders())
      expect(res.body.projects).toHaveLength(2)
    })
  })

  describe('PUT /api/projects/:id', () => {
    it('updates a project', async () => {
      const createRes = await request(app)
        .post('/api/projects')
        .set(authHeaders())
        .send({ name: 'Old Name' })

      const projectId = createRes.body.project._id

      const res = await request(app)
        .put(`/api/projects/${projectId}`)
        .set(authHeaders())
        .send({ name: 'New Name', status: 'completed' })

      expect(res.status).toBe(200)
      expect(res.body.project.name).toBe('New Name')
      expect(res.body.project.status).toBe('completed')
    })
  })

  describe('DELETE /api/projects/:id', () => {
    it('soft-deletes a project', async () => {
      const createRes = await request(app)
        .post('/api/projects')
        .set(authHeaders())
        .send({ name: 'To Delete' })
      const projectId = createRes.body.project._id

      const delRes = await request(app)
        .delete(`/api/projects/${projectId}`)
        .set(authHeaders())
      expect(delRes.status).toBe(200)

      // Should no longer appear in list
      const listRes = await request(app).get('/api/projects').set(authHeaders())
      expect(listRes.body.projects.find((p) => p._id === projectId)).toBeUndefined()
    })
  })
})
