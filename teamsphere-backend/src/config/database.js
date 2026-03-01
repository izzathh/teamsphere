const mongoose = require('mongoose')
const logger = require('../utils/logger')

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/teamsphere'

  try {
    const conn = await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    })

    logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`)
  } catch (err) {
    logger.error(`MongoDB connection error: ${err.message}`)
    process.exit(1)
  }
}

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected')
})

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB error: ${err.message}`)
})

module.exports = connectDB