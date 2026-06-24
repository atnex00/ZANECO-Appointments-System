const express = require('express')
const prisma = require('../db/database')
const { authenticate } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errors')

const router = express.Router()

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { appointment_id, admin_id, action, date_from, date_to, page = 1, per_page = 50 } = req.query
  const where = {}
  if (appointment_id) where.appointmentId = Number(appointment_id)
  if (admin_id) where.adminId = Number(admin_id)
  if (action) where.action = action
  if (date_from || date_to) {
    where.createdAt = {}
    if (date_from) where.createdAt.gte = date_from
    if (date_to) where.createdAt.lte = date_to
  }

  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: { administrator: { select: { fullName: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(per_page),
      take: Number(per_page),
    }),
  ])

  res.json({
    success: true,
    data: {
      audit_logs: logs.map(l => ({
        ...l,
        admin_name: l.administrator?.fullName || null,
        administrator: undefined,
      })),
      pagination: { current_page: Number(page), per_page: Number(per_page), total, last_page: Math.ceil(total / per_page) || 1 },
    },
  })
}))

module.exports = router
