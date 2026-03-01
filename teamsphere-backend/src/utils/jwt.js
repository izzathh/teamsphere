const jwt = require('jsonwebtoken')

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'dev_access_secret_change_me'
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_me'
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES_IN || '15m'
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d'

const generateAccessToken = (payload) => {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES
  })
}

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES
  })
}

const verifyAccessToken = (token) => {
  return jwt.verify(token, ACCESS_SECRET)
}

const verifyRefreshToken = (token) => {
  return jwt.verify(token, REFRESH_SECRET)
}

const generateTokenPair = (user) => {
  const payload = {
    sub: user._id.toString(),
    tenantId: user.tenantId.toString(),
    role: user.role,
  }
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  }
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenPair,
}