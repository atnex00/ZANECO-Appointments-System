const express = require('express')
const prisma = require('../db/database')
const { authenticate } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errors')

const router = express.Router()

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const offices = await prisma.office.findMany({ orderBy: { name: 'asc' } })
  res.json({ success: true, data: offices })
}))

router.post('/', authenticate, asyncHandler(async (req, res) => {
  if (req.admin.role !== 'super_admin') return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } })
  const { name, code, address, phone, email, opening_time, closing_time, slot_capacity, appointment_duration_minutes, max_advance_days, is_active } = req.body
  if (!name || !code) return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Name and code required' } })

  const result = await prisma.office.create({
    data: {
      name,
      code,
      address: address || null,
      phone: phone || null,
      email: email || null,
      openingTime: opening_time || '08:00:00',
      closingTime: closing_time || '17:00:00',
      slotCapacity: slot_capacity || 2,
      appointmentDurationMinutes: appointment_duration_minutes || 30,
      maxAdvanceDays: max_advance_days || 30,
      isActive: is_active !== undefined ? is_active : true,
    },
  })
  res.status(201).json({ success: true, data: { id: result.id } })
}))

router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  if (req.admin.role !== 'super_admin') return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } })
  const FIELD_MAP = {
    opening_time: 'openingTime',
    closing_time: 'closingTime',
    slot_capacity: 'slotCapacity',
    appointment_duration_minutes: 'appointmentDurationMinutes',
    max_advance_days: 'maxAdvanceDays',
    is_active: 'isActive',
  }
  const data = {}
  for (const key of ['name', 'code', 'address', 'phone', 'email', 'opening_time', 'closing_time', 'slot_capacity', 'appointment_duration_minutes', 'max_advance_days']) {
    if (req.body[key] !== undefined) data[FIELD_MAP[key] || key] = req.body[key]
  }
  if (req.body.is_active !== undefined) data.isActive = req.body.is_active
  if (!Object.keys(data).length) return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'No fields to update' } })

  await prisma.office.update({ where: { id: Number(req.params.id) }, data })
  res.json({ success: true, message: 'Office updated' })
}))

router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  if (req.admin.role !== 'super_admin') return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } })
  await prisma.office.update({ where: { id: Number(req.params.id) }, data: { isActive: false } })
  res.json({ success: true, message: 'Office deactivated' })
}))

router.put('/:id/schedule', authenticate, asyncHandler(async (req, res) => {
  if (req.admin.role !== 'super_admin' && req.admin.role !== 'office_manager') {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } })
  }
  const { schedules } = req.body
  if (!schedules || !Array.isArray(schedules)) return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Schedules array required' } })

  for (const s of schedules) {
    await prisma.officeSchedule.upsert({
      where: { officeId_dayOfWeek: { officeId: Number(req.params.id), dayOfWeek: s.day_of_week } },
      update: { openingTime: s.opening_time, closingTime: s.closing_time, isWorkingDay: s.is_working_day },
      create: {
        officeId: Number(req.params.id),
        dayOfWeek: s.day_of_week,
        openingTime: s.opening_time,
        closingTime: s.closing_time,
        isWorkingDay: s.is_working_day,
      },
    })
  }
  res.json({ success: true, message: 'Schedule updated' })
}))

module.exports = router
