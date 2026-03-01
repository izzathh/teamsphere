const User = require('../models/User')
const {
  sendSuccess,
  sendError,
  paginate
} = require('../utils/response')

const listUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = Math.min(parseInt(req.query.limit) || 100, 100)
    const skip = (page - 1) * limit
    const {
      role,
      search
    } = req.query

    const filter = {
      tenantId: req.tenantId,
      isDeleted: false
    }
    if (role) filter.role = role
    if (search) {
      filter.$or = [{
          name: {
            $regex: search,
            $options: 'i'
          }
        },
        {
          email: {
            $regex: search,
            $options: 'i'
          }
        },
      ]
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort({
        createdAt: 1
      }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ])

    return sendSuccess(res, {
      users,
      ...paginate(total, page, limit)
    })
  } catch (err) {
    next(err)
  }
}

const getUser = async (req, res, next) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
      isDeleted: false,
    })

    if (!user) return sendError(res, 'User not found', 404)

    return sendSuccess(res, {
      user
    })
  } catch (err) {
    next(err)
  }
}

const inviteUser = async (req, res, next) => {
  try {
    const {
      name,
      email,
      role,
      password
    } = req.body

    const existing = await User.findOne({
      email,
      tenantId: req.tenantId
    })
    console.log('existing', existing);

    if (existing && !existing.isDeleted) {
      return sendError(res, 'A user with this email already exists in your workspace', 409)
    }
    if (existing && !!existing.isDeleted) {
      return sendError(res, 'This account was deleted from the workspace. Undo delete coming soon!', 409)
    }

    const user = await User.create({
      tenantId: req.tenantId,
      name,
      email,
      password,
      role: role || 'employee',
    })

    return sendSuccess(res, {
      user
    }, 201, 'User invited successfully')
  } catch (err) {
    next(err)
  }
}

const updateUser = async (req, res, next) => {
  try {
    const targetId = req.params.id
    const {
      name,
      role,
      password,
      currentPassword
    } = req.body

    if (req.user._id.toString() !== targetId && req.user.role !== 'admin') {
      return sendError(res, 'You can only update your own profile', 403)
    }

    if (role && req.user.role !== 'admin') {
      return sendError(res, 'Only admins can change roles', 403)
    }

    const user = await User.findOne({
      _id: targetId,
      tenantId: req.tenantId,
      isDeleted: false,
    }).select('+password')

    if (!user) return sendError(res, 'User not found', 404)

    if (password && req.user._id.toString() === targetId) {
      if (!currentPassword) {
        return sendError(res, 'Current password is required to set a new password', 400)
      }
      const valid = await user.comparePassword(currentPassword)
      if (!valid) {
        return sendError(res, 'Current password is incorrect', 400)
      }
    }

    if (name) user.name = name
    if (role && req.user.role === 'admin') user.role = role
    if (password) user.password = password

    await user.save()

    return sendSuccess(res, {
      user: user.toJSON()
    }, 200, 'User updated')
  } catch (err) {
    next(err)
  }
}

const deleteUser = async (req, res, next) => {
  try {
    const targetId = req.params.id

    if (req.user._id.toString() === targetId) {
      return sendError(res, 'You cannot remove yourself', 400)
    }

    const user = await User.findOneAndUpdate({
      _id: targetId,
      tenantId: req.tenantId,
      isDeleted: false
    }, {
      isDeleted: true,
      deletedAt: new Date(),
      isActive: false
    }, {
      new: true
    })

    if (!user) return sendError(res, 'User not found', 404)

    return sendSuccess(res, {}, 200, 'User removed')
  } catch (err) {
    next(err)
  }
}

module.exports = {
  listUsers,
  getUser,
  inviteUser,
  updateUser,
  deleteUser
}