const Project = require('../models/Project')
const Task = require('../models/Task')
const {
  sendSuccess,
  sendError,
  paginate
} = require('../utils/response')

const listProjects = async (req, res, next) => {
  try {
    const tenantId = req.tenantId
    const page = parseInt(req.query.page) || 1
    const limit = Math.min(parseInt(req.query.limit) || 10, 100)
    const skip = (page - 1) * limit
    const {
      status,
      search
    } = req.query

    const filter = {
      tenantId,
      isDeleted: false
    }
    if (status) filter.status = status
    if (search) {
      filter.$or = [{
          name: {
            $regex: search,
            $options: 'i'
          }
        },
        {
          description: {
            $regex: search,
            $options: 'i'
          }
        },
      ]
    }

    const [projects, total] = await Promise.all([
      Project.find(filter)
      .populate('members', 'name email role')
      .populate('createdBy', 'name email')
      .sort({
        createdAt: -1
      })
      .skip(skip)
      .limit(limit),
      Project.countDocuments(filter),
    ])

    return sendSuccess(res, {
      projects,
      ...paginate(total, page, limit),
    })
  } catch (err) {
    next(err)
  }
}

const createProject = async (req, res, next) => {
  try {
    const {
      name,
      description,
      status,
      members
    } = req.body

    // Validate members belong to the same tenant
    if (members?.length) {
      const User = require('../models/User')
      const validMembers = await User.countDocuments({
        _id: {
          $in: members
        },
        tenantId: req.tenantId,
        isDeleted: false,
      })
      if (validMembers !== members.length) {
        return sendError(res, 'One or more members do not belong to this tenant', 400)
      }
    }

    const project = await Project.create({
      tenantId: req.tenantId,
      name,
      description,
      status,
      members: members || [],
      createdBy: req.user._id,
    })

    const populated = await project.populate([{
        path: 'members',
        select: 'name email role'
      },
      {
        path: 'createdBy',
        select: 'name email'
      },
    ])

    return sendSuccess(res, {
      project: populated
    }, 201, 'Project created')
  } catch (err) {
    next(err)
  }
}

const getProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({
        _id: req.params.id,
        tenantId: req.tenantId,
        isDeleted: false,
      })
      .populate('members', 'name email role')
      .populate('createdBy', 'name email')

    if (!project) return sendError(res, 'Project not found', 404)

    return sendSuccess(res, {
      project
    })
  } catch (err) {
    next(err)
  }
}

const updateProject = async (req, res, next) => {
  try {
    const {
      name,
      description,
      status,
      members
    } = req.body

    // Validate members belong to the same tenant
    if (members?.length) {
      const User = require('../models/User')
      const validMembers = await User.countDocuments({
        _id: {
          $in: members
        },
        tenantId: req.tenantId,
        isDeleted: false,
      })
      if (validMembers !== members.length) {
        return sendError(res, 'One or more members do not belong to this tenant', 400)
      }
    }

    const project = await Project.findOneAndUpdate({
        _id: req.params.id,
        tenantId: req.tenantId,
        isDeleted: false
      }, {
        name,
        description,
        status,
        members: members || []
      }, {
        new: true,
        runValidators: true
      })
      .populate('members', 'name email role')
      .populate('createdBy', 'name email')

    if (!project) return sendError(res, 'Project not found', 404)

    return sendSuccess(res, {
      project
    }, 200, 'Project updated')
  } catch (err) {
    next(err)
  }
}

const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findOneAndUpdate({
      _id: req.params.id,
      tenantId: req.tenantId,
      isDeleted: false
    }, {
      isDeleted: true,
      deletedAt: new Date()
    }, {
      new: true
    })

    if (!project) return sendError(res, 'Project not found', 404)

    // Soft-delete all tasks in this project too
    await Task.updateMany({
      projectId: req.params.id,
      tenantId: req.tenantId
    }, {
      isDeleted: true,
      deletedAt: new Date()
    })

    return sendSuccess(res, {}, 200, 'Project deleted')
  } catch (err) {
    next(err)
  }
}

module.exports = {
  listProjects,
  createProject,
  getProject,
  updateProject,
  deleteProject
}