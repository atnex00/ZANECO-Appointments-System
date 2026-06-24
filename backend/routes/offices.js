const express = require('express')
const prisma = require('../db/database')
const { asyncHandler } = require('../middleware/errors')

const router = express.Router()

router.get('/', asyncHandler(async (req, res) => {
  const offices = await prisma.office.findMany({
    where: { isActive: true },
    select: { id: true, name: true, code: true, address: true, openingTime: true, closingTime: true },
    orderBy: { name: 'asc' },
  })
  res.json({ success: true, data: offices })
}))

router.get('/:id/schedule', asyncHandler(async (req, res) => {
  const schedules = await prisma.officeSchedule.findMany({
    where: { officeId: Number(req.params.id) },
    orderBy: { dayOfWeek: 'asc' },
  })
  res.json({ success: true, data: schedules })
}))

router.get('/:id/slots', asyncHandler(async (req, res) => {
  const { date } = req.query
  if (!date) return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Date parameter required' } })

  const dayOfWeek = new Date(date + 'T00:00:00').getDay()
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return res.json({ success: true, data: { date, office_id: Number(req.params.id), is_working_day: false, slots: [] } })
  }

  const slots = await prisma.timeSlot.findMany({
    where: { officeId: Number(req.params.id), slotDate: date },
    select: { startTime: true, endTime: true, bookedCount: true, maxCapacity: true },
    orderBy: { startTime: 'asc' },
  })
  res.json({
    success: true,
    data: {
      date,
      office_id: Number(req.params.id),
      is_working_day: true,
      slots: slots.map(s => ({ start_time: s.startTime, end_time: s.endTime, available: s.bookedCount < s.maxCapacity })),
    },
  })
}))

module.exports = router
