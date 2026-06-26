if (typeof BigInt !== 'undefined' && !BigInt.prototype.toJSON) {
  BigInt.prototype.toJSON = function () { return Number(this) }
}

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const config = require('./config')
const prisma = require('./db/database')
const { init } = require('./db/database')
const { logger, requestLogger } = require('./middleware/logger')
const { errorHandler } = require('./middleware/errors')
const worker = require('./worker')

const app = express()
const server = app.listen.bind(app)

// --- Trust proxy (for req.ip to respect X-Forwarded-For) ---
app.set('trust proxy', 1)

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
app.use('/api/v1/auth', authLimiter, require('./routes/passwordReset'))
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
app.use('/api/v1/system', require('./routes/systemStatus'))

// Dashboard summary
app.get('/api/v1/admin/dashboard/summary', require('./middleware/auth').authenticate, async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0]
    const monthStart = new Date(); monthStart.setDate(1); const ms = monthStart.toISOString().split('T')[0]
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay()); const ws = weekStart.toISOString().split('T')[0]
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7); const wa = weekAgo.toISOString().split('T')[0]

    const [totalToday, pending, completed, cancelled, rejected, no_show, totalMonth, totalWeek] = await Promise.all([
      prisma.appointment.count({ where: { appointmentDate: { startsWith: today } } }),
      prisma.appointment.count({ where: { status: 'pending' } }),
      prisma.appointment.count({ where: { status: 'completed' } }),
      prisma.appointment.count({ where: { status: 'cancelled' } }),
      prisma.appointment.count({ where: { status: 'rejected' } }),
      prisma.appointment.count({ where: { status: 'no_show' } }),
      prisma.appointment.count({ where: { appointmentDate: { gte: ms } } }),
      prisma.appointment.count({ where: { appointmentDate: { gte: ws } } }),
    ])

    const weeklyTrend = await prisma.appointment.groupBy({
      by: ['appointmentDate'],
      where: { appointmentDate: { gte: wa, lte: today } },
      _count: { id: true },
      orderBy: { appointmentDate: 'asc' },
    })

    const busyOffice = await prisma.appointment.groupBy({
      by: ['officeId'],
      where: { appointmentDate: { startsWith: today } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 1,
    })

    let busyOfficeName = 'N/A'
    if (busyOffice.length) {
      const off = await prisma.office.findUnique({ where: { id: busyOffice[0].officeId } })
      busyOfficeName = off?.name || 'N/A'
    }

    const peakHourRaw = await prisma.$queryRaw`
      SELECT CAST(SUBSTRING(start_time, 1, 2) AS INTEGER) AS hour, COUNT(*)::int AS c
      FROM appointments
      WHERE appointment_date = ${today}
      GROUP BY hour
      ORDER BY c DESC
      LIMIT 1
    `

    const peakHour = peakHourRaw[0]

    res.json({
      success: true,
      data: {
        total_today: totalToday,
        total_week: totalWeek,
        total_month: totalMonth,
        pending,
        completed,
        cancelled,
        rejected,
        no_show,
        busiest_office: busyOfficeName,
        busiest_hour: peakHour ? `${String(peakHour.hour).padStart(2,'0')}:00-${String(peakHour.hour+1).padStart(2,'0')}:00` : 'N/A',
        weekly_trend: weeklyTrend.map(w => ({ date: w.appointmentDate, count: w._count.id })),
      },
    })
  } catch (err) { next(err) }
})

// Health check
app.get('/api/v1/health', async (req, res) => {
  let dbStatus = 'ok'
  try {
    await prisma.$queryRaw`SELECT 1`
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
    srv.close(async () => {
      await prisma.$disconnect()
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
