const express = require('express')
const prisma = require('../db/database')
const { authenticate } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errors')

const router = express.Router()

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { status, page = 1, per_page = 50 } = req.query
  const where = status ? { status } : {}
  if (req.admin.role !== 'super_admin') {
    where.appointment = { officeId: req.admin.officeId }
  }

  const [total, notifications] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (Number(page) - 1) * Number(per_page),
      take: Number(per_page),
    }),
  ])

  res.json({
    success: true,
    data: {
      notifications,
      pagination: { current_page: Number(page), per_page: Number(per_page), total, last_page: Math.ceil(total / per_page) || 1 },
    },
  })
}))

router.post('/resend/:id', authenticate, asyncHandler(async (req, res) => {
  const notif = await prisma.notification.findUnique({
    where: { id: Number(req.params.id) },
    include: { appointment: { select: { officeId: true } } },
  })
  if (!notif) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Notification not found' } })
  if (req.admin.role !== 'super_admin' && notif.appointment.officeId !== req.admin.officeId) {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } })
  }

  await prisma.notification.update({
    where: { id: notif.id },
    data: { status: 'pending', retryCount: 0 },
  })
  res.json({ success: true, message: 'Notification queued for resend' })
}))

module.exports = router
