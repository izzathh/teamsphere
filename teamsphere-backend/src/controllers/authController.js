const Tenant = require('../models/Tenant')
const User = require('../models/User')
const {
  generateTokenPair,
  verifyRefreshToken
} = require('../utils/jwt')
const {
  sendSuccess,
  sendError
} = require('../utils/response')
const logger = require('../utils/logger')

const register = async (req, res, next) => {
  try {
    const {
      tenantName,
      name,
      email,
      password
    } = req.body

    const tenant = await Tenant.create({
      name: tenantName
    })

    const user = await User.create({
      tenantId: tenant._id,
      name,
      email,
      password,
      role: 'admin',
    })

    const tokens = generateTokenPair(user)

    logger.info(`New tenant registered: ${tenant.name} (${tenant._id})`)

    return sendSuccess(
      res, {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: user.toJSON(),
        tenant,
      },
      201,
      'Workspace created successfully'
    )
  } catch (err) {
    next(err)
  }
}

const login = async (req, res, next) => {
  try {
    const {
      email,
      password,
      tenantId
    } = req.body

    // We need password field for comparison
    const user = await User.findOne({
      email,
      tenantId,
      isActive: true,
      isDeleted: false
    }).select('+password')

    if (!user) {
      return sendError(res, 'Invalid email, tenant or password', 401)
    }

    const isValid = await user.comparePassword(password)
    if (!isValid) {
      return sendError(res, 'Invalid password', 401)
    }

    // Update last login
    user.lastLoginAt = new Date()
    await user.save({
      validateBeforeSave: false
    })

    const tenant = await Tenant.findById(user.tenantId)
    if (!tenant || !tenant.isActive) {
      return sendError(res, 'Tenant account is inactive', 403)
    }

    const tokens = generateTokenPair(user)

    return sendSuccess(res, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: user.toJSON(),
      tenant,
    })
  } catch (err) {
    next(err)
  }
}

const validateEmail = async (req, res) => {
  const {
    email
  } = req.body
  const tenants = await User.aggregate([{
      $match: {
        email,
        isActive: true,
        isDeleted: false
      }
    },
    {
      $lookup: {
        from: 'tenants',
        localField: 'tenantId',
        foreignField: '_id',
        as: 'tenant'
      }
    },
    {
      $match: {
        'tenant.isActive': true
      }
    },
    {
      $project: {
        tenant: {
          $arrayElemAt: ['$tenant', 0]
        }
      }
    },
    {
      $group: {
        _id: null,
        tenants: {
          $push: '$tenant'
        }
      }
    }
  ])
  return sendSuccess(res, {
    tenants: tenants[0]?.tenants || []
  })
}

const refresh = async (req, res, next) => {
  try {
    const {
      refreshToken
    } = req.body

    let decoded
    try {
      decoded = verifyRefreshToken(refreshToken)
    } catch {
      return sendError(res, 'Invalid or expired refresh token', 401)
    }

    const user = await User.findOne({
      _id: decoded.sub,
      tenantId: decoded.tenantId,
      isActive: true,
      isDeleted: false,
    })

    if (!user) {
      return sendError(res, 'User not found', 401)
    }

    const {
      generateAccessToken
    } = require('../utils/jwt')
    const accessToken = generateAccessToken({
      sub: user._id.toString(),
      tenantId: user.tenantId.toString(),
      role: user.role,
    })

    return sendSuccess(res, {
      accessToken
    })
  } catch (err) {
    next(err)
  }
}

const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
    const tenant = await Tenant.findById(req.tenantId)
    return sendSuccess(res, {
      user,
      tenant
    })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  register,
  login,
  validateEmail,
  refresh,
  me
}