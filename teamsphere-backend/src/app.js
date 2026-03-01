const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const morgan = require('morgan')
const mongoSanitize = require('express-mongo-sanitize')
const swaggerUi = require('swagger-ui-express')

const swaggerSpec = require('./config/swagger')
const logger = require('./utils/logger')
const {
  errorHandler,
  notFound
} = require('./middleware/errorHandler')

const authRoutes = require('./routes/auth')
const projectRoutes = require('./routes/projects')
const taskRoutes = require('./routes/tasks')
const userRoutes = require('./routes/users')
const dashboardRoutes = require('./routes/dashboard')

const app = express()

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: 'cross-origin'
    },
  })
)

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
  })
)

app.use(compression())
app.use(express.json({
  limit: '10kb'
}))
app.use(express.urlencoded({
  extended: true,
  limit: '10kb'
}))
app.use(mongoSanitize())

if (process.env.NODE_ENV !== 'test') {
  app.use(
    morgan('combined', {
      stream: {
        write: (msg) => logger.info(msg.trim())
      },
    })
  )
}

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'TeamSphere API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  })
})

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCssUrl: 'https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.10.3/swagger-ui.min.css',
    customSiteTitle: 'TeamSphere API Docs',
    swaggerOptions: {
      persistAuthorization: true
    },
  })
)

app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.send(swaggerSpec)
})

app.use('/api/auth', authRoutes)
app.use('/api/projects', projectRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/users', userRoutes)
app.use('/api/dashboard', dashboardRoutes)

app.use(notFound)
app.use(errorHandler)

module.exports = app