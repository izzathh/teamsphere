const { describe, it, expect, beforeAll } = require('@jest/globals')

// Set env vars before requiring utils
process.env.JWT_ACCESS_SECRET = 'test_access_secret'
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret'
process.env.JWT_ACCESS_EXPIRES_IN = '15m'
process.env.JWT_REFRESH_EXPIRES_IN = '7d'

const {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenPair,
} = require('../../src/utils/jwt')

const MOCK_USER = {
  _id: { toString: () => 'user123' },
  tenantId: { toString: () => 'tenant456' },
  role: 'admin',
}

describe('JWT Utility', () => {
  describe('generateAccessToken', () => {
    it('generates a string token', () => {
      const token = generateAccessToken({ sub: 'u1', tenantId: 't1', role: 'admin' })
      expect(typeof token).toBe('string')
      expect(token.split('.')).toHaveLength(3) // JWT has 3 parts
    })
  })

  describe('verifyAccessToken', () => {
    it('verifies a valid access token', () => {
      const payload = { sub: 'u1', tenantId: 't1', role: 'manager' }
      const token = generateAccessToken(payload)
      const decoded = verifyAccessToken(token)
      expect(decoded.sub).toBe('u1')
      expect(decoded.tenantId).toBe('t1')
      expect(decoded.role).toBe('manager')
    })

    it('throws on invalid token', () => {
      expect(() => verifyAccessToken('bad.token.here')).toThrow()
    })

    it('throws on token signed with wrong secret', () => {
      const jwt = require('jsonwebtoken')
      const bad = jwt.sign({ sub: 'x' }, 'wrong_secret')
      expect(() => verifyAccessToken(bad)).toThrow()
    })
  })

  describe('verifyRefreshToken', () => {
    it('verifies a valid refresh token', () => {
      const token = generateRefreshToken({ sub: 'u2', tenantId: 't2', role: 'employee' })
      const decoded = verifyRefreshToken(token)
      expect(decoded.sub).toBe('u2')
    })

    it('rejects access token used as refresh token', () => {
      const access = generateAccessToken({ sub: 'u1', tenantId: 't1', role: 'admin' })
      // Access and refresh use different secrets, so this should fail
      expect(() => verifyRefreshToken(access)).toThrow()
    })
  })

  describe('generateTokenPair', () => {
    it('returns both tokens', () => {
      const pair = generateTokenPair(MOCK_USER)
      expect(pair).toHaveProperty('accessToken')
      expect(pair).toHaveProperty('refreshToken')
    })

    it('access token contains correct payload', () => {
      const { accessToken } = generateTokenPair(MOCK_USER)
      const decoded = verifyAccessToken(accessToken)
      expect(decoded.sub).toBe('user123')
      expect(decoded.tenantId).toBe('tenant456')
      expect(decoded.role).toBe('admin')
    })
  })
})
