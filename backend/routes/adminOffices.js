const express = require('express')
const { prepare } = require('../db/database')
const { authenticate } = require('../middleware/auth')

const router = express.Router()

router.get('/', authenticate, (req, res) => {
  let query = 'SELECT * FROM offices ORDER BY name'
  const offices = prepare(query).all()
  res.json({ success: true, data: offices })
})

router.post('/', authenticate, (req, res) => {
  if (req.admin.role !== 'super_admin') return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } })
  const { name, code, address, phone, email, opening_time, closing_time, slot_capacity, appointment_duration_minutes, max_advance_days, is_active } = req.body
  if (!name || !code) return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Name and code required' } })

  const result = prepare('INSERT INTO offices (name, code, address, phone, email, opening_time, closing_time, slot_capacity, appointment_duration_minutes, max_advance_days, is_active) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
    .run(name, code, address, phone, email, opening_time || '08:00:00', closing_time || '17:00:00', slot_capacity || 2, appointment_duration_minutes || 30, max_advance_days || 30, is_active !== undefined ? (is_active ? 1 : 0) : 1)

  res.status(201).json({ success: true, data: { id: result.lastInsertRowid } })
})

router.put('/:id', authenticate, (req, res) => {
  if (req.admin.role !== 'super_admin') return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } })
  const fields = []
  const params = []
  for (const key of ['name', 'code', 'address', 'phone', 'email', 'opening_time', 'closing_time', 'slot_capacity', 'appointment_duration_minutes', 'max_advance_days']) {
    if (req.body[key] !== undefined) { fields.push(`${key} = ?`); params.push(req.body[key]) }
  }
  if (req.body.is_active !== undefined) { fields.push('is_active = ?'); params.push(req.body.is_active ? 1 : 0) }
  if (fields.length === 0) return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'No fields to update' } })

  fields.push("updated_at = datetime('now')")
  params.push(req.params.id)
  prepare(`UPDATE offices SET ${fields.join(', ')} WHERE id = ?`).run(...params)
  res.json({ success: true, message: 'Office updated' })
})

router.put('/:id/schedule', authenticate, (req, res) => {
  const { schedules } = req.body
  if (!schedules || !Array.isArray(schedules)) return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Schedules array required' } })

  const upsert = prepare('INSERT OR REPLACE INTO office_schedules (office_id, day_of_week, opening_time, closing_time, is_working_day, updated_at) VALUES (?, ?, ?, ?, ?, datetime(\'now\'))')
  for (const s of schedules) {
    upsert.run(req.params.id, s.day_of_week, s.opening_time, s.closing_time, s.is_working_day ? 1 : 0)
  }
  res.json({ success: true, message: 'Schedule updated' })
})

module.exports = router

