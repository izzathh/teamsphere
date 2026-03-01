const mongoose = require('mongoose')

const projectSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [200, 'Name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'on_hold', 'completed', 'archived'],
        message: 'Invalid project status',
      },
      default: 'active',
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
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
  { timestamps: true }
)

// Compound indexes for tenant-scoped queries
projectSchema.index({ tenantId: 1, status: 1, isDeleted: 1 })
projectSchema.index({ tenantId: 1, createdAt: -1 })
projectSchema.index({ tenantId: 1, name: 'text' }) // text search

projectSchema.set('toJSON', {
  transform: (_, ret) => {
    delete ret.__v
    delete ret.isDeleted
    delete ret.deletedAt
    return ret
  },
})

module.exports = mongoose.model('Project', projectSchema)
