require('dotenv').config()
const app = require('./app')
const connectDB = require('./config/database')
const logger = require('./utils/logger')

const PORT = process.env.PORT || 5000

const start = async () => {
  await connectDB()

  const server = app.listen(PORT, () => {
    logger.info(`
╔════════════════════════════════════════╗
║   TeamSphere API                       ║
║   Port    : ${PORT}                       ║
║   Mode    : ${process.env.NODE_ENV || 'development'}              ║
║   Docs    : http://localhost:${PORT}/api-docs ║
╚════════════════════════════════════════╝
    `)
  })

  const shutdown = (signal) => {
    logger.info(`${signal} received — shutting down gracefully`)
    server.close(() => {
      logger.info('HTTP server closed')
      process.exit(0)
    })
    // Force exit after 10s
    setTimeout(() => process.exit(1), 10000)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))

  process.on('unhandledRejection', (err) => {
    logger.error(`Unhandled Rejection: ${err.message}`, {
      stack: err.stack
    })
    shutdown('UNHANDLED_REJECTION')
  })
}

start()