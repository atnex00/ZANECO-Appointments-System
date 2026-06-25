const express = require('express')
const config = require('../config')
const prisma = require('../db/database')
const { asyncHandler } = require('../middleware/errors')

const router = express.Router()

const startedAt = Date.now()

router.get('/status', asyncHandler(async (req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - startedAt) / 1000)

  let dbHealthy = false
  let dbError = null
  try {
    await prisma.$queryRaw`SELECT 1`
    dbHealthy = true
  } catch (err) {
    dbError = err.message
  }

  const today = new Date().toISOString().split('T')[0]
  const [totalToday, pendingCount] = await Promise.all([
    prisma.appointment.count({ where: { appointmentDate: { startsWith: today } } }),
    prisma.appointment.count({ where: { status: 'pending' } }),
  ])

  const mem = process.memoryUsage()

  res.json({
    success: true,
    data: {
      status: dbHealthy ? 'operational' : 'degraded',
      uptime: uptimeSeconds,
      database: { healthy: dbHealthy, error: dbError },
      appointments: { today: totalToday, pending: pendingCount },
      email: { configured: !!config.email.smtpHost },
      environment: config.nodeEnv,
      memory: {
        rss: Math.round(mem.rss / 1024 / 1024),
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      },
      checkedAt: new Date().toISOString(),
    },
  })
}))

module.exports = router
