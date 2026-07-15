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
  for (const key of ['name', 'code', 'address', 'phone', 'email', 'opening_time', 'closing_time', 'slot_capacity', 'appointment_duration_minutes', 'max_advance_days', 'is_active']) {
    if (req.body[key] !== undefined) data[FIELD_MAP[key] || key] = req.body[key]
  }
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
    if (!s || typeof s !== 'object' || !s.day_of_week || !s.opening_time || !s.closing_time || s.is_working_day === undefined) {
      return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Each schedule entry requires day_of_week, opening_time, closing_time, and is_working_day' } })
    }
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

router.post('/:id/generate-slots', authenticate, asyncHandler(async (req, res) => {
  if (req.admin.role !== 'super_admin' && req.admin.role !== 'office_manager') {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } })
  }

  const officeId = Number(req.params.id)
  const { date_from, date_to } = req.body

  if (!date_from || !date_to) {
    return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'date_from and date_to are required' } })
  }

  const office = await prisma.office.findUnique({ where: { id: officeId } })
  if (!office) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Office not found' } })

  const schedules = await prisma.officeSchedule.findMany({ where: { officeId } })
  const scheduleMap = {}
  for (const s of schedules) {
    scheduleMap[s.dayOfWeek] = s
  }

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const start = new Date(date_from + 'T00:00:00')
  const end = new Date(date_to + 'T00:00:00')
  const duration = office.appointmentDurationMinutes
  let created = 0

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10)
    const dayName = dayNames[d.getDay()]
    const schedule = scheduleMap[dayName]
    if (!schedule || !schedule.isWorkingDay) continue

    const openH = parseInt(schedule.openingTime.slice(0, 2))
    const openM = parseInt(schedule.openingTime.slice(3, 5))
    const closeH = parseInt(schedule.closingTime.slice(0, 2))
    const closeM = parseInt(schedule.closingTime.slice(3, 5))

    const slots = []
    for (let h = openH; h < closeH; h++) {
      for (let m = (h === openH ? openM : 0); m < 60; m += duration) {
        const startTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
        const endMinutes = h * 60 + m + duration
        const eh = Math.floor(endMinutes / 60)
        const em = endMinutes % 60
        if (eh > closeH || (eh === closeH && em > closeM)) continue
        const endTime = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}:00`
        slots.push({ officeId, slotDate: dateStr, startTime, endTime, maxCapacity: office.slotCapacity })
      }
    }

    if (slots.length > 0) {
      await prisma.timeSlot.createMany({ data: slots, skipDuplicates: true })
      created += slots.length
    }
  }

  res.json({ success: true, data: { slots_created: created, office_id: officeId, date_from, date_to } })
}))

module.exports = router
