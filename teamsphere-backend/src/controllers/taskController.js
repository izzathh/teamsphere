const Task = require('../models/Task')
const Project = require('../models/Project')
const User = require('../models/User')
const {
  sendSuccess,
  sendError,
  paginate
} = require('../utils/response')

const POPULATE_TASK = [{
    path: 'assignedTo',
    select: 'name email role'
  },
  {
    path: 'projectId',
    select: 'name status'
  },
  {
    path: 'createdBy',
    select: 'name email'
  },
  {
    path: 'comments.author',
    select: 'name email'
  },
]

const listTasks = async (req, res, next) => {
  try {
    const tenantId = req.tenantId
    const page = parseInt(req.query.page) || 1
    const limit = Math.min(parseInt(req.query.limit) || 12, 100)
    const skip = (page - 1) * limit
    const {
      status,
      priority,
      projectId,
      assignedTo,
      search,
      overdue
    } = req.query

    const filter = {
      tenantId,
      isDeleted: false
    }

    if (status) filter.status = status
    if (priority) filter.priority = priority
    if (projectId) filter.projectId = projectId
    if (assignedTo) filter.assignedTo = assignedTo

    // Overdue: due date is in the past and task is not done
    if (overdue === 'true') {
      filter.dueDate = {
        $lt: new Date()
      }
      filter.status = {
        $ne: 'done'
      }
    }

    if (search) {
      filter.$or = [{
          title: {
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

    const [tasks, total] = await Promise.all([
      Task.find(filter)
      .populate(POPULATE_TASK)
      .sort({
        createdAt: -1
      })
      .skip(skip)
      .limit(limit),
      Task.countDocuments(filter),
    ])

    return sendSuccess(res, {
      tasks,
      ...paginate(total, page, limit)
    })
  } catch (err) {
    next(err)
  }
}

const createTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      status,
      priority,
      assignedTo,
      projectId,
      dueDate
    } = req.body

    // Validate assignedTo belongs to same tenant
    if (assignedTo) {
      const user = await User.findOne({
        _id: assignedTo,
        tenantId: req.tenantId,
        isDeleted: false
      })
      if (!user) return sendError(res, 'Assigned user not found in this tenant', 400)
    }

    // Validate projectId belongs to same tenant
    if (projectId) {
      const project = await Project.findOne({
        _id: projectId,
        tenantId: req.tenantId,
        isDeleted: false
      })
      if (!project) return sendError(res, 'Project not found in this tenant', 400)
    }

    const task = await Task.create({
      tenantId: req.tenantId,
      title,
      description,
      status: status || 'todo',
      priority: priority || 'medium',
      assignedTo: assignedTo || null,
      projectId: projectId || null,
      dueDate: dueDate || null,
      createdBy: req.user._id,
    })

    const populated = await task.populate(POPULATE_TASK)

    return sendSuccess(res, {
      task: populated
    }, 201, 'Task created')
  } catch (err) {
    next(err)
  }
}

const getTask = async (req, res, next) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
      isDeleted: false,
    }).populate(POPULATE_TASK)

    if (!task) return sendError(res, 'Task not found', 404)

    return sendSuccess(res, {
      task
    })
  } catch (err) {
    next(err)
  }
}

const updateTask = async (req, res, next) => {
  try {
    const {
      title,
      description,
      status,
      priority,
      assignedTo,
      projectId,
      dueDate
    } = req.body

    if (assignedTo) {
      const user = await User.findOne({
        _id: assignedTo,
        tenantId: req.tenantId,
        isDeleted: false
      })
      if (!user) return sendError(res, 'Assigned user not found in this tenant', 400)
    }

    if (projectId) {
      const project = await Project.findOne({
        _id: projectId,
        tenantId: req.tenantId,
        isDeleted: false
      })
      if (!project) return sendError(res, 'Project not found in this tenant', 400)
    }

    const updates = {}
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (status !== undefined) updates.status = status
    if (priority !== undefined) updates.priority = priority
    if (assignedTo !== undefined) updates.assignedTo = assignedTo || null
    if (projectId !== undefined) updates.projectId = projectId || null
    if (dueDate !== undefined) updates.dueDate = dueDate || null

    const task = await Task.findOneAndUpdate({
        _id: req.params.id,
        tenantId: req.tenantId,
        isDeleted: false
      },
      updates, {
        new: true,
        runValidators: true
      }
    ).populate(POPULATE_TASK)

    if (!task) return sendError(res, 'Task not found', 404)

    return sendSuccess(res, {
      task
    }, 200, 'Task updated')
  } catch (err) {
    next(err)
  }
}

const updateTaskStatus = async (req, res, next) => {
  try {
    const {
      status
    } = req.body

    const task = await Task.findOneAndUpdate({
      _id: req.params.id,
      tenantId: req.tenantId,
      isDeleted: false
    }, {
      status
    }, {
      new: true,
      runValidators: true
    }).populate(POPULATE_TASK)

    if (!task) return sendError(res, 'Task not found', 404)

    return sendSuccess(res, {
      task
    }, 200, 'Task status updated')
  } catch (err) {
    next(err)
  }
}

const addComment = async (req, res, next) => {
  try {
    const {
      comment
    } = req.body

    const task = await Task.findOneAndUpdate({
      _id: req.params.id,
      tenantId: req.tenantId,
      isDeleted: false
    }, {
      $push: {
        comments: {
          text: comment,
          author: req.user._id,
          createdAt: new Date(),
        },
      },
    }, {
      new: true
    }).populate(POPULATE_TASK)

    if (!task) return sendError(res, 'Task not found', 404)

    return sendSuccess(res, {
      task
    }, 201, 'Comment added')
  } catch (err) {
    next(err)
  }
}

const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findOneAndUpdate({
      _id: req.params.id,
      tenantId: req.tenantId,
      isDeleted: false
    }, {
      isDeleted: true,
      deletedAt: new Date()
    }, {
      new: true
    })

    if (!task) return sendError(res, 'Task not found', 404)

    return sendSuccess(res, {}, 200, 'Task deleted')
  } catch (err) {
    next(err)
  }
}

module.exports = {
  listTasks,
  createTask,
  getTask,
  updateTask,
  updateTaskStatus,
  addComment,
  deleteTask
}