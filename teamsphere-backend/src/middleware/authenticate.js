const {
  verifyAccessToken
} = require('../utils/jwt')
const User = require('../models/User')
const {
  sendError
} = require('../utils/response')

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Access token required', 401)
    }

    const token = authHeader.split(' ')[1]
    const decoded = verifyAccessToken(token)

    const user = await User.findOne({
      _id: decoded.sub,
      tenantId: decoded.tenantId,
      isActive: true,
      isDeleted: false,
    })

    if (!user) {
      return sendError(res, 'User not found or inactive', 401)
    }

    req.user = user
    req.tenantId = user.tenantId.toString()
    next()
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return sendError(res, 'Invalid access token', 401)
    }
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Access token expired', 401)
    }
    next(err)
  }
}

module.exports = {
  authenticate
}