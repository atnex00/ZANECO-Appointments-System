const prisma = require('../db/database')
const config = require('../config')

module.exports = async function rateLimitBooking(req, res, next) {
  if (!config.isProduction) return next()

  const ip = req.ip
  const oneHourAgo = new Date(Date.now() - 3600000).toISOString()

  const recent = await prisma.bookingRequest.findFirst({
    where: { ip, createdAt: { gte: oneHourAgo } },
    orderBy: { createdAt: 'desc' },
  })

  if (recent) {
    console.warn(`[BOOKING LIMIT] Blocked ${ip} — last request at ${recent.createdAt}`)
    return res.status(429).json({
      success: false,
      error: { code: 'RATE_LIMITED', message: 'You can only book one appointment per hour. Please try again later.' },
    })
  }

  next()
}
