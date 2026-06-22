const express = require('express')
const { prepare } = require('../db/database')
const { authenticate } = require('../middleware/auth')

const router = express.Router()

// List appointments
router.get('/', authenticate, (req, res) => {
  const { status, office_id, date_from, date_to, search, page = 1, per_page = 20, sort_by = 'created_at', sort_order = 'desc' } = req.query
  const offset = (page - 1) * per_page
  const allowedSort = ['created_at', 'appointment_date', 'consumer_name', 'status']
  const sortCol = allowedSort.includes(sort_by) ? sort_by : 'created_at'
  const sortDir = sort_order === 'asc' ? 'ASC' : 'DESC'

  let where = ['1=1']
  let params = []

  // Role-based filtering
  if (req.admin.role === 'office_manager' || req.admin.role === 'staff') {
    where.push('a.office_id = ?')
    params.push(req.admin.office_id)
  }

  if (status) { where.push('a.status = ?'); params.push(status) }
  if (office_id) { where.push('a.office_id = ?'); params.push(office_id) }
  if (date_from) { where.push('a.appointment_date >= ?'); params.push(date_from) }
  if (date_to) { where.push('a.appointment_date <= ?'); params.push(date_to) }
  if (search) {
    where.push('(a.reference_number LIKE ? OR a.consumer_name LIKE ? OR a.account_number LIKE ? OR a.mobile_number LIKE ?)')
    const q = `%${search}%`
    params.push(q, q, q, q)
  }

  const countRow = prepare(`SELECT COUNT(*) AS total FROM appointments a WHERE ${where.join(' AND ')}`).get(...params)
  const total = countRow.total
  const lastPage = Math.ceil(total / per_page)

  const appointments = prepare(`
    SELECT a.id, a.reference_number, a.consumer_name, a.account_number, c.name AS concern_type, o.name AS office,
           a.appointment_date, a.start_time, a.end_time, a.status, a.created_at
    FROM appointments a
    JOIN concern_types c ON a.concern_type_id = c.id
    JOIN offices o ON a.office_id = o.id
    WHERE ${where.join(' AND ')}
    ORDER BY a.${sortCol} ${sortDir}
    LIMIT ? OFFSET ?
  `).all(...params, Number(per_page), Number(offset))

  res.json({
    success: true,
    data: { appointments, pagination: { current_page: Number(page), per_page: Number(per_page), total, last_page: lastPage || 1 } },
  })
})

// Get appointment detail
router.get('/:id', authenticate, (req, res) => {
  const appt = prepare(`
    SELECT a.*, c.name AS concern_type, o.name AS office, o.address AS office_address
    FROM appointments a
    JOIN concern_types c ON a.concern_type_id = c.id
    JOIN offices o ON a.office_id = o.id
    WHERE a.id = ?
  `).get(req.params.id)

  if (!appt) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Appointment not found' } })

  const auditLogs = prepare("SELECT action, admin_id, created_at FROM audit_logs WHERE appointment_id = ? ORDER BY created_at").all(appt.id)
  const notifications = prepare("SELECT * FROM notifications WHERE appointment_id = ? ORDER BY created_at DESC").all(appt.id)

  res.json({
    success: true,
    data: {
      id: appt.id,
      reference_number: appt.reference_number,
      consumer_name: appt.consumer_name,
      account_name: appt.account_name,
      account_number: appt.account_number,
      mobile_number: appt.mobile_number,
      email: appt.email,
      concern_type: appt.concern_type,
      office: appt.office,
      appointment_date: appt.appointment_date,
      start_time: appt.start_time,
      end_time: appt.end_time,
      status: appt.status,
      admin_notes: appt.admin_notes,
      reschedule_count: appt.reschedule_count,
      created_at: appt.created_at,
      notifications,
      audit_trail: auditLogs,
    },
  })
})

// Update status
router.put('/:id/status', authenticate, (req, res) => {
  const { status, notes } = req.body
  const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show', 'archived']
  if (!validStatuses.includes(status)) return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid status' } })

  const appt = prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id)
  if (!appt) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Appointment not found' } })

  const oldStatus = appt.status

  // Release slot when moving to a terminal state
  if (status === 'cancelled' || status === 'no_show' || status === 'archived') {
    prepare('UPDATE time_slots SET booked_count = MAX(booked_count - 1, 0) WHERE office_id = ? AND slot_date = ? AND start_time = ?').run(appt.office_id, appt.appointment_date, appt.start_time)
  }

  // Re-book slot when reopening from a terminal state
  if (['cancelled', 'no_show', 'archived', 'completed'].includes(oldStatus) && status === 'pending') {
    const slot = prepare('SELECT * FROM time_slots WHERE office_id = ? AND slot_date = ? AND start_time = ?').get(appt.office_id, appt.appointment_date, appt.start_time)
    if (slot && slot.booked_count < slot.max_capacity) {
      prepare('UPDATE time_slots SET booked_count = booked_count + 1 WHERE id = ?').run(slot.id)
    }
  }

  const completedAt = status === 'completed' ? new Date().toISOString() : null

  prepare('UPDATE appointments SET status = ?, admin_notes = COALESCE(?, admin_notes), completed_at = ?, processed_by = ?, updated_at = datetime(?) WHERE id = ?')
    .run(status, notes || null, completedAt, req.admin.id, new Date().toISOString(), appt.id)

  prepare("INSERT INTO audit_logs (appointment_id, admin_id, action, entity_type, entity_id, old_values, new_values) VALUES (?, ?, ?, 'appointment', ?, ?, ?)")
    .run(appt.id, req.admin.id, 'STATUS_CHANGED', appt.id, JSON.stringify({ status: oldStatus }), JSON.stringify({ status, notes }))

  res.json({ success: true, data: { id: appt.id, status }, message: `Appointment status updated to ${status}` })
})

// Admin reschedule
router.put('/:id/reschedule', authenticate, (req, res) => {
  const { new_appointment_date, new_start_time, notes } = req.body
  const appt = prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id)
  if (!appt) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Appointment not found' } })

  const office = prepare('SELECT * FROM offices WHERE id = ?').get(appt.office_id)
  const [h, m] = new_start_time.split(':').map(Number)
  const endDate = new Date(2024, 0, 1, h, m + office.appointment_duration_minutes)
  const end_time = String(endDate.getHours()).padStart(2, '0') + ':' + String(endDate.getMinutes()).padStart(2, '0') + ':00'

  prepare('UPDATE time_slots SET booked_count = MAX(booked_count - 1, 0) WHERE office_id = ? AND slot_date = ? AND start_time = ?').run(appt.office_id, appt.appointment_date, appt.start_time)

  const slot = prepare('SELECT * FROM time_slots WHERE office_id = ? AND slot_date = ? AND start_time = ?').get(appt.office_id, new_appointment_date, new_start_time)
  if (slot) prepare('UPDATE time_slots SET booked_count = booked_count + 1 WHERE id = ?').run(slot.id)

  prepare('UPDATE appointments SET appointment_date = ?, start_time = ?, end_time = ?, status = ?, reschedule_count = reschedule_count + 1, rescheduled_at = datetime(?), admin_notes = COALESCE(?, admin_notes), updated_at = datetime(?) WHERE id = ?')
    .run(new_appointment_date, new_start_time, end_time, 'rescheduled', new Date().toISOString(), notes || null, new Date().toISOString(), appt.id)

  prepare("INSERT INTO audit_logs (appointment_id, admin_id, action, entity_type, entity_id, new_values) VALUES (?, ?, 'APPOINTMENT_RESCHEDULED', 'appointment', ?, ?)")
    .run(appt.id, req.admin.id, appt.id, JSON.stringify({ date: new_appointment_date, time: new_start_time, reason: notes }))

  res.json({ success: true, data: { reference_number: appt.reference_number, status: 'rescheduled' } })
})

// Hard delete — for testing/bug-hunting only
router.delete('/:id', authenticate, (req, res) => {
  if (req.admin.role !== 'super_admin') {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only super admins can delete appointments' } })
  }
  const appt = prepare('SELECT * FROM appointments WHERE id = ?').get(req.params.id)
  if (!appt) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Appointment not found' } })

  // Release the time slot
  prepare('UPDATE time_slots SET booked_count = MAX(booked_count - 1, 0) WHERE office_id = ? AND slot_date = ? AND start_time = ?').run(appt.office_id, appt.appointment_date, appt.start_time)
  // Delete related records
  prepare('DELETE FROM notifications WHERE appointment_id = ?').run(appt.id)
  prepare('DELETE FROM audit_logs WHERE appointment_id = ?').run(appt.id)
  prepare('DELETE FROM appointments WHERE id = ?').run(appt.id)

  res.json({ success: true, message: 'Appointment deleted permanently' })
})

module.exports = router

