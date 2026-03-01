const Project = require('../models/Project')
const Task = require('../models/Task')
const {
  sendSuccess
} = require('../utils/response')

const getStats = async (req, res, next) => {
  try {
    const tenantId = req.user.tenantId
    const now = new Date()

    // Run all aggregations in parallel
    const [projectStats, taskStats, overdueCount] = await Promise.all([
      Project.aggregate([{
          $match: {
            tenantId,
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: '$status',
            count: {
              $sum: 1
            },
          },
        },
      ]),

      Task.aggregate([{
          $match: {
            tenantId,
            isDeleted: false,
          },
        },
        {
          $group: {
            _id: '$status',
            count: {
              $sum: 1
            },
          },
        },
      ]),

      Task.countDocuments({
        tenantId,
        isDeleted: false,
        status: {
          $ne: 'done'
        },
        dueDate: {
          $lt: now
        },
      }),
    ])

    const projectsByStatus = {}
    let totalProjects = 0
    for (const s of projectStats) {
      projectsByStatus[s._id] = s.count
      totalProjects += s.count
    }
    const activeProjects = projectsByStatus['active'] || 0

    const tasksByStatus = {
      todo: 0,
      in_progress: 0,
      done: 0,
      on_hold: 0
    }
    let totalTasks = 0
    for (const s of taskStats) {
      tasksByStatus[s._id] = s.count
      totalTasks += s.count
    }

    return sendSuccess(res, {
      totalProjects,
      activeProjects,
      projectsByStatus,
      totalTasks,
      tasksByStatus,
      overdueCount,
    })
  } catch (err) {
    next(err)
  }
}

module.exports = {
  getStats
}