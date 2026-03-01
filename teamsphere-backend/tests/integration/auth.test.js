const {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach
} = require('@jest/globals')
const request = require('supertest')
const app = require('../../src/app')
const db = require('../testDb')

process.env.JWT_ACCESS_SECRET = 'test_access_secret'
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret'
process.env.NODE_ENV = 'test'

beforeAll(async () => await db.connect())
afterAll(async () => await db.close())
beforeEach(async () => await db.clear())

describe('Auth API', () => {
  const registerPayload = {
    tenantName: 'Test Corp',
    name: 'Admin User',
    email: 'admin@testcorp.com',
    password: 'Password123!',
  }
  let tenantId

  describe('POST /api/auth/register', () => {
    it('creates a tenant and admin user, returns tokens', async () => {
      const res = await request(app).post('/api/auth/register').send(registerPayload)

      expect(res.status).toBe(201)
      expect(res.body.success).toBe(true)
      expect(res.body.accessToken).toBeDefined()
      expect(res.body.refreshToken).toBeDefined()
      expect(res.body.user.role).toBe('admin')
      expect(res.body.user.email).toBe('admin@testcorp.com')
      expect(res.body.user.password).toBeUndefined() // password never returned
      expect(res.body.tenant.name).toBe('Test Corp')
      tenantId = res.body.tenant._id
    })

    it('returns 400 for missing fields', async () => {
      const res = await request(app).post('/api/auth/register').send({
        tenantName: 'X',
        email: 'not-an-email',
      })
      expect(res.status).toBe(400)
      expect(res.body.success).toBe(false)
    })

    it('returns 400 for weak password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          ...registerPayload,
          password: 'weak'
        })
      expect(res.status).toBe(400)
    })
  })

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send(registerPayload)
    })

    it('returns tokens for valid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'admin@testcorp.com',
        password: 'Password123!',
        tenantId,
      })
      expect(res.status).toBe(200)
      expect(res.body.accessToken).toBeDefined()
      expect(res.body.user.email).toBe('admin@testcorp.com')
    })

    it('returns 401 for wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'admin@testcorp.com',
        password: 'WrongPassword!',
        tenantId,
      })
      expect(res.status).toBe(401)
    })

    it('returns 401 for unknown email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nobody@testcorp.com',
        password: 'Password123!',
        tenantId,
      })
      expect(res.status).toBe(401)
    })

    it('returns 401 for wrong tenantId', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'admin@testcorp.com',
        password: 'Password123!',
        tenantId: 'wrong_tenant_id',
      })
      expect(res.status).toBe(401)
    })
  })

  describe('POST /api/auth/refresh', () => {
    let refreshToken

    beforeEach(async () => {
      const res = await request(app).post('/api/auth/register').send(registerPayload)
      refreshToken = res.body.refreshToken
    })

    it('returns a new access token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken
        })
      expect(res.status).toBe(200)
      expect(res.body.accessToken).toBeDefined()
    })

    it('returns 401 for invalid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid.token.here'
        })
      expect(res.status).toBe(401)
    })
  })

  describe('GET /api/auth/me', () => {
    let accessToken

    beforeEach(async () => {
      const res = await request(app).post('/api/auth/register').send(registerPayload)
      accessToken = res.body.accessToken
    })

    it('returns current user when authenticated', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
      expect(res.status).toBe(200)
      expect(res.body.user.email).toBe('admin@testcorp.com')
    })

    it('returns 401 without token', async () => {
      const res = await request(app).get('/api/auth/me')
      expect(res.status).toBe(401)
    })
  })
})

describe('POST /api/auth/validate-email', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send(registerPayload)
  })

  it('returns tenants for valid email', async () => {
    const res = await request(app)
      .post('/api/auth/validate-email')
      .send({
        email: 'admin@testcorp.com'
      })

    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.tenants)).toBe(true)
    expect(res.body.tenants.length).toBeGreaterThan(0)
    expect(res.body.tenants[0]._id).toBe(tenantId)
  })

  it('returns empty array for unknown email', async () => {
    const res = await request(app)
      .post('/api/auth/validate-email')
      .send({
        email: 'unknown@test.com'
      })

    expect(res.status).toBe(200)
    expect(res.body.tenants).toEqual([])
  })
})