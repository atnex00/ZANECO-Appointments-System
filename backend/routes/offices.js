const express = require('express')
const prisma = require('../db/database')

const router = express.Router()

router.get('/', (req, res) => {
  prisma.office.findMany({
    where: { isActive: true },
    select: { id: true, name: true, code: true, address: true, openingTime: true, closingTime: true },
    orderBy: { name: 'asc' },
  }).then(offices => res.json({ success: true, data: offices }))
})

router.get('/:id/schedule', (req, res) => {
  prisma.officeSchedule.findMany({
    where: { officeId: Number(req.params.id) },
    orderBy: { dayOfWeek: 'asc' },
  }).then(schedules => res.json({ success: true, data: schedules }))
})

router.get('/:id/slots', (req, res) => {
  const { date } = req.query
  if (!date) return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Date parameter required' } })

  const dayOfWeek = new Date(date + 'T00:00:00').getDay()
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return res.json({ success: true, data: { date, office_id: Number(req.params.id), is_working_day: false, slots: [] } })
  }

  prisma.timeSlot.findMany({
    where: { officeId: Number(req.params.id), slotDate: date },
    select: { startTime: true, endTime: true, bookedCount: true, maxCapacity: true },
    orderBy: { startTime: 'asc' },
  }).then(slots => {
    res.json({
      success: true,
      data: {
        date,
        office_id: Number(req.params.id),
        is_working_day: true,
        slots: slots.map(s => ({ start_time: s.startTime, end_time: s.endTime, available: s.bookedCount < s.maxCapacity })),
      },
    })
  })
})

module.exports = router
