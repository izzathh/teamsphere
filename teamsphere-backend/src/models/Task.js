const mongoose = require('mongoose')

const commentSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Comment too long'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
)

const taskSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [300, 'Title cannot exceed 300 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [5000, 'Description too long'],
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['todo', 'in_progress', 'done', 'on_hold'],
        message: 'Invalid task status',
      },
      default: 'todo',
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high', 'critical'],
        message: 'Invalid priority',
      },
      default: 'medium',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    comments: [commentSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

// Virtual: isOverdue — computed at query time
taskSchema.virtual('isOverdue').get(function () {
  if (!this.dueDate || this.status === 'done') return false
  return new Date() > new Date(this.dueDate)
})

// Compound indexes
taskSchema.index({ tenantId: 1, status: 1, isDeleted: 1 })
taskSchema.index({ tenantId: 1, assignedTo: 1, isDeleted: 1 })
taskSchema.index({ tenantId: 1, projectId: 1, isDeleted: 1 })
taskSchema.index({ tenantId: 1, dueDate: 1, status: 1 }) // for overdue queries
taskSchema.index({ tenantId: 1, createdAt: -1 })
taskSchema.index({ tenantId: 1, title: 'text' }) // text search

taskSchema.set('toJSON', {
  virtuals: true,
  transform: (_, ret) => {
    delete ret.__v
    delete ret.isDeleted
    delete ret.deletedAt
    delete ret.id // remove duplicate id
    return ret
  },
})

module.exports = mongoose.model('Task', taskSchema)
