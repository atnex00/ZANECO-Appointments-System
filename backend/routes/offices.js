const express = require('express')
const { prepare } = require('../db/database')

const router = express.Router()

// List active offices (public)
router.get('/', (req, res) => {
  const offices = prepare('SELECT id, name, code, address, opening_time, closing_time FROM offices WHERE is_active = 1 ORDER BY name').all()
  res.json({ success: true, data: offices })
})

// Get office schedule (public)
router.get('/:id/schedule', (req, res) => {
  const schedules = prepare('SELECT * FROM office_schedules WHERE office_id = ? ORDER BY CASE day_of_week WHEN \'monday\' THEN 1 WHEN \'tuesday\' THEN 2 WHEN \'wednesday\' THEN 3 WHEN \'thursday\' THEN 4 WHEN \'friday\' THEN 5 ELSE 6 END').all(req.params.id)
  res.json({ success: true, data: schedules })
})

// Get available time slots (public)
router.get('/:id/slots', (req, res) => {
  const { date } = req.query
  if (!date) return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Date parameter required' } })

  const dayOfWeek = new Date(date + 'T00:00:00').getDay()
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return res.json({ success: true, data: { date, office_id: Number(req.params.id), is_working_day: false, slots: [] } })
  }

  const slots = prepare('SELECT start_time, end_time, (booked_count < max_capacity) AS available FROM time_slots WHERE office_id = ? AND slot_date = ? ORDER BY start_time').all(req.params.id, date)

  res.json({ success: true, data: { date, office_id: Number(req.params.id), is_working_day: true, slots } })
})

module.exports = router

