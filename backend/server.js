const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const config = require('./config')
const { init } = require('./db/database')
const { logger, requestLogger } = require('./middleware/logger')
const { errorHandler } = require('./middleware/errors')
const worker = require('./worker')

const app = express()
const server = app.listen.bind(app)

// --- Security ---
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for API — enable if serving frontend assets
  crossOriginEmbedderPolicy: false,
}))

// --- CORS ---
app.use(cors({
  origin: config.isProduction ? config.cors.origin : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

// --- Rate Limiting ---
const globalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests, please try again later' } },
})
app.use(globalLimiter)

const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { code: 'RATE_LIMITED', message: 'Too many login attempts. Try again later.' } },
})

// --- Body parsing ---
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: false }))

// --- Request logging ---
app.use(requestLogger)

// --- Routes ---
app.use('/api/v1/auth', authLimiter, require('./routes/auth'))
app.use('/api/v1/appointments', require('./routes/appointments'))
app.use('/api/v1/offices', require('./routes/offices'))
app.use('/api/v1/concern-types', require('./routes/concernTypesPublic'))
app.use('/api/v1/admin/appointments', require('./routes/adminAppointments'))
app.use('/api/v1/admin/offices', require('./routes/adminOffices'))
app.use('/api/v1/admin/concern-types', require('./routes/concernTypes'))
app.use('/api/v1/admin/reports', require('./routes/reports'))
app.use('/api/v1/admin/notifications', require('./routes/notifications'))
app.use('/api/v1/admin/audit-logs', require('./routes/auditLogs'))
app.use('/api/v1/admin/users', require('./routes/adminUsers'))

// Dashboard summary
app.get('/api/v1/admin/dashboard/summary', require('./middleware/auth').authenticate, (req, res) => {
  const { prepare } = require('./db/database')
  const today = new Date().toISOString().split('T')[0]
  const monthStart = new Date(); monthStart.setDate(1); const ms = monthStart.toISOString().split('T')[0]
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay()); const ws = weekStart.toISOString().split('T')[0]

  const totalToday = prepare("SELECT COUNT(*) AS c FROM appointments WHERE appointment_date = ?").get(today).c
  const pending = prepare("SELECT COUNT(*) AS c FROM appointments WHERE status = 'pending'").get().c
  const completed = prepare("SELECT COUNT(*) AS c FROM appointments WHERE status = 'completed'").get().c
  const cancelled = prepare("SELECT COUNT(*) AS c FROM appointments WHERE status = 'cancelled'").get().c
  const no_show = prepare("SELECT COUNT(*) AS c FROM appointments WHERE status = 'no_show'").get().c
  const totalMonth = prepare("SELECT COUNT(*) AS c FROM appointments WHERE appointment_date >= ?").get(ms).c
  const totalWeek = prepare("SELECT COUNT(*) AS c FROM appointments WHERE appointment_date >= ?").get(ws).c
  const weeklyTrend = prepare("SELECT appointment_date AS date, COUNT(*) AS count FROM appointments WHERE appointment_date >= date('now', '-7 days') GROUP BY appointment_date ORDER BY appointment_date").all()
  const busyOffice = prepare("SELECT o.name FROM offices o JOIN appointments a ON a.office_id = o.id WHERE a.appointment_date = ? GROUP BY o.id ORDER BY COUNT(a.id) DESC LIMIT 1").get(today)
  const peakHour = prepare("SELECT CAST(STRFTIME('%H', start_time) AS INTEGER) AS hour, COUNT(*) AS c FROM appointments WHERE appointment_date = ? GROUP BY hour ORDER BY c DESC LIMIT 1").get(today)

  res.json({ success: true, data: { total_today: totalToday, total_week: totalWeek, total_month: totalMonth, pending, completed, cancelled, no_show, busiest_office: busyOffice?.name || 'N/A', busiest_hour: peakHour ? `${String(peakHour.hour).padStart(2,'0')}:00-${String(peakHour.hour+1).padStart(2,'0')}:00` : 'N/A', weekly_trend: weeklyTrend } })
})

// Health check
app.get('/api/v1/health', (req, res) => {
  let dbStatus = 'ok'
  try {
    const { prepare } = require('./db/database')
    prepare('SELECT 1').get()
  } catch {
    dbStatus = 'error'
  }
  res.json({
    status: dbStatus === 'ok' ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
    db: dbStatus,
  })
})

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} not found` } })
})

// Error handler
app.use(errorHandler)

// --- Start ---
async function startApp() {
  await init()
  worker.start(30000)
  const srv = app.listen(config.port, () => {
    logger.info(`ZANECO API started`, { port: config.port, env: config.nodeEnv })
  })

  // Graceful shutdown
  function shutdown(signal) {
    logger.info(`${signal} received — shutting down gracefully`)
    worker.stop()
    srv.close(() => {
      logger.info('Server closed')
      process.exit(0)
    })
    // Force exit after 10s
    setTimeout(() => { logger.error('Forced shutdown'); process.exit(1) }, 10000)
  }

  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}

startApp()
