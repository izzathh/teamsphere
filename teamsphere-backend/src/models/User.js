const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant ID is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never returned in queries by default
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'manager', 'employee'],
        message: 'Role must be admin, manager, or employee',
      },
      default: 'employee',
    },
    isActive: {
      type: Boolean,
      default: true,
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
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
)

// Compound unique index: email is unique per tenant
userSchema.index({ tenantId: 1, email: 1 }, { unique: true })
userSchema.index({ tenantId: 1, isDeleted: 1 })

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  const salt = await bcrypt.genSalt(12)
  this.password = await bcrypt.hash(this.password, salt)
  next()
})

// Hash password on update
userSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate()
  if (update?.password) {
    const salt = await bcrypt.genSalt(12)
    update.password = await bcrypt.hash(update.password, salt)
  }
  next()
})

// Instance method: compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// Transform output — strip sensitive fields
userSchema.set('toJSON', {
  transform: (_, ret) => {
    delete ret.password
    delete ret.__v
    delete ret.isDeleted
    delete ret.deletedAt
    return ret
  },
})

module.exports = mongoose.model('User', userSchema)
