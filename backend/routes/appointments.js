const express = require('express')
const db = require('../db/database')
const { AppError, asyncHandler } = require('../middleware/errors')
const Joi = require('joi')

const router = express.Router()

function generateRef(attempt = 0) {
  const now = new Date()
  const y = String(now.getFullYear()).slice(-2)
  const m = String(now.getMonth() + 1).padStart(2, '0')
  // SUBSTR at position 8 skips the 7-char prefix ZNC+YY+MM
  const row = db.prepare("SELECT COALESCE(MAX(CAST(SUBSTR(reference_number, 8) AS INTEGER)), 0) + 1 AS next FROM appointments WHERE reference_number LIKE ?").get(y + m + '%')
  const seq = String(row.next + attempt).padStart(6, '0')
  return 'ZNC' + y + m + seq
}

const createSchema = Joi.object({
  consumer_name: Joi.string().trim().min(1).max(150).required(),
  account_name: Joi.string().trim().min(1).max(150).required(),
  account_number: Joi.string().trim().max(50).required(),
  mobile_number: Joi.string().pattern(/^09\d{9}$/).required().messages({ 'string.pattern.base': 'Invalid mobile number format (09XXXXXXXXX)' }),
  email: Joi.string().email().allow('', null).optional(),
  concern_type_id: Joi.number().integer().required(),
  office_id: Joi.number().integer().required(),
  appointment_date: Joi.string().isoDate().required(),
  start_time: Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).required(),
})

router.post('/', asyncHandler(async (req, res) => {
  // Normalize incoming fields
  if (req.body.mobile_number) req.body.mobile_number = req.body.mobile_number.replace(/[^0-9]/g, '')
  if (req.body.start_time) {
    // Accept HH:MM, HH:MM:SS, HHMM, H:MM, etc. - normalize to HH:MM:SS
    const parts = req.body.start_time.replace(/[^0-9]/g, '')
    if (parts.length >= 4) {
      const h = parts.slice(0, 2).padStart(2, '0')
      const m = parts.slice(2, 4).padStart(2, '0')
      req.body.start_time = h + ':' + m + ':00'
    } else if (parts.length === 3) {
      req.body.start_time = '0' + parts[0] + ':' + parts.slice(1, 3) + ':00'
    }
  }
  if (!req.body.email) delete req.body.email
  const { error, value } = createSchema.validate(req.body, { abortEarly: false })
  if (error) {
    const details = {}
    error.details.forEach(d => { const k = d.path[0]; if (!details[k]) details[k] = []; details[k].push(d.message) })
    console.error('VALIDATION ERROR - Body:', JSON.stringify(req.body, null, 2))
    console.error('VALIDATION ERROR - Details:', JSON.stringify(details, null, 2))
    throw new AppError(422, 'VALIDATION_ERROR', 'Validation failed', details)
  }
  let { consumer_name, account_name, account_number, mobile_number, email, concern_type_id, office_id, appointment_date, start_time } = value
  // Strip any time component from the date
  appointment_date = appointment_date.slice(0, 10)

  const office = db.prepare('SELECT * FROM offices WHERE id = ? AND is_active = 1').get(office_id)
  if (!office) throw new AppError(404, 'NOT_FOUND', 'Office not found')
  const concern = db.prepare('SELECT * FROM concern_types WHERE id = ? AND is_active = 1').get(concern_type_id)
  if (!concern) throw new AppError(404, 'NOT_FOUND', 'Concern type not found')

  const [h, m] = start_time.split(':').map(Number)
  const endDate = new Date(2024, 0, 1, h, m + office.appointment_duration_minutes)
  const end_time = String(endDate.getHours()).padStart(2, '0') + ':' + String(endDate.getMinutes()).padStart(2, '0') + ':00'

  // Auto-generate slots for this date if they don't exist yet
  const existingSlots = db.prepare('SELECT COUNT(*) AS c FROM time_slots WHERE office_id = ? AND slot_date = ?').get(office_id, appointment_date)
  if (existingSlots.c === 0) {
    const dayOfWeek = new Date(appointment_date + 'T00:00:00').getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) throw new AppError(400, 'BAD_REQUEST', 'Selected date is a weekend. Please choose a weekday.')
    const duration = office.appointment_duration_minutes
    for (let h = 8; h < 17; h++) {
      for (let m = 0; m < 60; m += duration) {
        const st = String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0') + ':00'
        const eh = m + duration >= 60 ? h + 1 : h
        const em = m + duration >= 60 ? m + duration - 60 : m + duration
        const et = String(eh).padStart(2,'0') + ':' + String(em).padStart(2,'0') + ':00'
        if (eh < 17) {
          db.prepare('INSERT OR IGNORE INTO time_slots (office_id, slot_date, start_time, end_time, max_capacity) VALUES (?,?,?,?,?)').run(office_id, appointment_date, st, et, office.slot_capacity)
        }
      }
    }
  }

  const slot = db.prepare('SELECT * FROM time_slots WHERE office_id = ? AND slot_date = ? AND start_time = ?').get(office_id, appointment_date, start_time)
  if (!slot) throw new AppError(404, 'NOT_FOUND', 'Time slot not found for the selected time. Available times are 08:00-16:30 on weekdays.')
  if (slot.booked_count >= slot.max_capacity) throw new AppError(409, 'SLOT_FULL', 'This time slot is no longer available')

  // Generate reference number with retry on collision
  let ref, result
  for (let attempt = 0; attempt < 5; attempt++) {
    ref = generateRef(attempt)
    try {
      result = db.prepare("INSERT INTO appointments (reference_number, consumer_name, account_name, account_number, mobile_number, email, concern_type_id, office_id, appointment_date, start_time, end_time, status) VALUES (?,?,?,?,?,?,?,?,?,?,?,'pending')").run(ref, consumer_name, account_name, account_number, mobile_number.replace(/\s/g, ''), email || null, concern_type_id, office_id, appointment_date, start_time, end_time)
      break
    } catch (err) {
      if (attempt === 4) throw new AppError(500, 'INTERNAL_ERROR', 'Failed to generate unique reference number')
      // collision — retry with next sequence
    }
  }
  db.prepare('UPDATE time_slots SET booked_count = booked_count + 1 WHERE id = ?').run(slot.id)
  db.prepare("INSERT INTO audit_logs (appointment_id, action, entity_type, entity_id, new_values) VALUES (?, 'APPOINTMENT_CREATED', 'appointment', ?, ?)").run(result.lastInsertRowid, result.lastInsertRowid, JSON.stringify(req.body))

  const a = db.prepare("SELECT a.*, c.name AS ct, o.name AS oname FROM appointments a JOIN concern_types c ON a.concern_type_id = c.id JOIN offices o ON a.office_id = o.id WHERE a.id = ?").get(result.lastInsertRowid)
  res.status(201).json({ success: true, data: { reference_number: a.reference_number, consumer_name: a.consumer_name, account_name: a.account_name, account_number: a.account_number, mobile_number: a.mobile_number, email: a.email, concern_type: a.ct, office: a.oname, appointment_date: a.appointment_date, start_time: a.start_time, end_time: a.end_time, status: a.status, created_at: a.created_at } })
}))

router.get('/:reference_number', asyncHandler(async (req, res) => {
  const a = db.prepare("SELECT a.*, c.name AS ct, o.name AS oname, o.address AS oaddr FROM appointments a JOIN concern_types c ON a.concern_type_id = c.id JOIN offices o ON a.office_id = o.id WHERE a.reference_number = ?").get(req.params.reference_number)
  if (!a) throw new AppError(404, 'NOT_FOUND', 'Appointment not found')
  res.json({ success: true, data: { reference_number: a.reference_number, consumer_name: a.consumer_name, account_name: a.account_name, account_number: a.account_number, mobile_number: a.mobile_number, email: a.email, concern_type: a.ct, office: a.oname, office_address: a.oaddr, office_id: a.office_id, appointment_date: a.appointment_date, start_time: a.start_time, end_time: a.end_time, status: a.status, created_at: a.created_at } })
}))

router.put('/:reference_number/reschedule', asyncHandler(async (req, res) => {
  const { mobile_number, new_date, new_start_time } = req.body
  const a = db.prepare('SELECT * FROM appointments WHERE reference_number = ?').get(req.params.reference_number)
  if (!a) throw new AppError(404, 'NOT_FOUND', 'Appointment not found')
  if (a.mobile_number !== mobile_number) throw new AppError(403, 'FORBIDDEN', 'Mobile number does not match')
  if (['cancelled', 'completed'].includes(a.status)) throw new AppError(400, 'BAD_REQUEST', 'Cannot reschedule')
  if (a.reschedule_count >= 2) throw new AppError(400, 'MAX_RESCHEDULE', 'Maximum reschedule limit')
  const oldD = a.appointment_date, oldT = a.start_time
  const o = db.prepare('SELECT * FROM offices WHERE id = ?').get(a.office_id)
  const [h, m] = new_start_time.split(':').map(Number)
  const end = new Date(2024, 0, 1, h, m + o.appointment_duration_minutes)
  const et = String(end.getHours()).padStart(2,'0')+':'+String(end.getMinutes()).padStart(2,'0')+':00'
  const cleanDate = new_date.slice(0, 10)
  const s = db.prepare('SELECT * FROM time_slots WHERE office_id=? AND slot_date=? AND start_time=?').get(a.office_id, cleanDate, new_start_time)
  if (!s || s.booked_count >= s.max_capacity) throw new AppError(409, 'SLOT_FULL', 'Slot unavailable')
  db.prepare('UPDATE time_slots SET booked_count = MAX(booked_count-1,0) WHERE office_id=? AND slot_date=? AND start_time=?').run(a.office_id, oldD, oldT)
  db.prepare('UPDATE time_slots SET booked_count = booked_count+1 WHERE id=?').run(s.id)
  db.prepare("UPDATE appointments SET appointment_date=?, start_time=?, end_time=?, status='rescheduled', reschedule_count=reschedule_count+1, rescheduled_at=datetime(?) WHERE id=?").run(cleanDate, new_start_time, et, new Date().toISOString(), a.id)
  res.json({ success: true, data: { reference_number: a.reference_number, status: 'rescheduled', message: 'Appointment rescheduled successfully' } })
}))

router.put('/:reference_number/cancel', asyncHandler(async (req, res) => {
  const { mobile_number } = req.body
  const a = db.prepare('SELECT * FROM appointments WHERE reference_number = ?').get(req.params.reference_number)
  if (!a) throw new AppError(404, 'NOT_FOUND', 'Appointment not found')
  if (a.mobile_number !== mobile_number) throw new AppError(403, 'FORBIDDEN', 'Mobile number does not match')
  db.prepare('UPDATE time_slots SET booked_count = MAX(booked_count-1,0) WHERE office_id=? AND slot_date=? AND start_time=?').run(a.office_id, a.appointment_date, a.start_time)
  db.prepare("UPDATE appointments SET status='cancelled', updated_at=datetime(?) WHERE id=?").run(new Date().toISOString(), a.id)
  res.json({ success: true, data: { reference_number: a.reference_number, status: 'cancelled', message: 'Appointment cancelled successfully' } })
}))

module.exports = router
