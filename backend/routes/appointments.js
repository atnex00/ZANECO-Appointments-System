const express = require('express')
const prisma = require('../db/database')
const { AppError, asyncHandler } = require('../middleware/errors')
const Joi = require('joi')
const emailService = require('../services/emailService')

const router = express.Router()

async function generateRef(attempt = 0) {
  const now = new Date()
  const y = String(now.getFullYear()).slice(-2)
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const row = await prisma.$queryRaw`
    SELECT COALESCE(MAX(CAST(SUBSTRING(reference_number, 8) AS INTEGER)), 0) + 1 AS next
    FROM appointments WHERE reference_number LIKE ${y + m + '%'}
  `
  const seq = String(Number(row[0]?.next || 0) + attempt).padStart(6, '0')
  return 'ZNC' + y + m + seq
}

const createSchema = Joi.object({
  consumer_name: Joi.string().trim().min(1).max(150).required(),
  account_name: Joi.string().trim().min(1).max(150).required(),
  account_number: Joi.string().trim().max(50).required(),
  email: Joi.string().email().allow('', null).optional(),
  concern_type_id: Joi.number().integer().required(),
  office_id: Joi.number().integer().required(),
  appointment_date: Joi.string().isoDate().required(),
  start_time: Joi.string().pattern(/^\d{2}:\d{2}(:\d{2})?$/).required(),
})

router.post('/', asyncHandler(async (req, res) => {
  if (req.body.start_time) {
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
    throw new AppError(422, 'VALIDATION_ERROR', 'Validation failed', details)
  }
  let { consumer_name, account_name, account_number, email, concern_type_id, office_id, appointment_date, start_time } = value
  appointment_date = appointment_date.slice(0, 10)

  const [office, concern] = await Promise.all([
    prisma.office.findUnique({ where: { id: office_id } }),
    prisma.concernType.findUnique({ where: { id: concern_type_id } }),
  ])
  if (!office || !office.isActive) throw new AppError(404, 'NOT_FOUND', 'Office not found')
  if (!concern || !concern.isActive) throw new AppError(404, 'NOT_FOUND', 'Concern type not found')

  const [h, m] = start_time.split(':').map(Number)
  const endDate = new Date(2024, 0, 1, h, m + office.appointmentDurationMinutes)
  const end_time = String(endDate.getHours()).padStart(2, '0') + ':' + String(endDate.getMinutes()).padStart(2, '0') + ':00'

  const existingSlots = await prisma.timeSlot.count({ where: { officeId: office_id, slotDate: appointment_date } })
  if (existingSlots === 0) {
    const dayOfWeek = new Date(appointment_date + 'T00:00:00').getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) throw new AppError(400, 'BAD_REQUEST', 'Selected date is a weekend. Please choose a weekday.')
    const duration = office.appointmentDurationMinutes
    const slots = []
    for (let h = 8; h < 17; h++) {
      for (let m = 0; m < 60; m += duration) {
        const st = String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0') + ':00'
        const eh = m + duration >= 60 ? h + 1 : h
        const em = m + duration >= 60 ? m + duration - 60 : m + duration
        const et = String(eh).padStart(2,'0') + ':' + String(em).padStart(2,'0') + ':00'
        if (eh < 17 && h !== 12) {
          slots.push({ officeId: office_id, slotDate: appointment_date, startTime: st, endTime: et, maxCapacity: office.slotCapacity })
        }
      }
    }
    await prisma.timeSlot.createMany({ data: slots, skipDuplicates: true })
  }

  const slot = await prisma.timeSlot.findUnique({
    where: { officeId_slotDate_startTime: { officeId: office_id, slotDate: appointment_date, startTime: start_time } },
  })
  if (!slot) throw new AppError(404, 'NOT_FOUND', 'Time slot not found for the selected time. Available times are 08:00-16:30 on weekdays.')
  if (slot.bookedCount >= slot.maxCapacity) throw new AppError(409, 'SLOT_FULL', 'This time slot is no longer available')

  let ref, appointment
  for (let attempt = 0; attempt < 5; attempt++) {
    ref = await generateRef(attempt)
    try {
      appointment = await prisma.appointment.create({
        data: {
          referenceNumber: ref,
          consumerName: consumer_name,
          accountName: account_name,
          accountNumber: account_number,
          email: email || null,
          concernTypeId: concern_type_id,
          officeId: office_id,
          appointmentDate: appointment_date,
          startTime: start_time,
          endTime: end_time,
          status: 'pending',
        },
        include: { concernType: true, office: true },
      })
      break
    } catch (err) {
      if (attempt === 4) throw new AppError(500, 'INTERNAL_ERROR', 'Failed to generate unique reference number')
    }
  }

  await prisma.timeSlot.update({ where: { id: slot.id }, data: { bookedCount: { increment: 1 } } })

  await prisma.auditLog.create({
    data: {
      appointmentId: appointment.id,
      action: 'APPOINTMENT_CREATED',
      entityType: 'appointment',
      entityId: appointment.id,
      newValues: JSON.stringify(req.body),
    },
  })

  if (appointment.email) {
    emailService.sendConfirmation({
      email: appointment.email,
      consumer_name: appointment.consumerName,
      reference_number: appointment.referenceNumber,
      appointment_date: appointment.appointmentDate,
      start_time: appointment.startTime,
      end_time: appointment.endTime,
      office: appointment.office.name,
      concern_type: appointment.concernType.name,
      status: appointment.status,
    }).catch(() => {})
  }

  res.status(201).json({
    success: true,
    data: {
      reference_number: appointment.referenceNumber,
      consumer_name: appointment.consumerName,
      account_name: appointment.accountName,
      account_number: appointment.accountNumber,
      email: appointment.email,
      concern_type: appointment.concernType.name,
      office: appointment.office.name,
      appointment_date: appointment.appointmentDate,
      start_time: appointment.startTime,
      end_time: appointment.endTime,
      status: appointment.status,
      created_at: appointment.createdAt,
    },
  })
}))

router.get('/:reference_number', asyncHandler(async (req, res) => {
  const a = await prisma.appointment.findUnique({
    where: { referenceNumber: req.params.reference_number },
    include: { concernType: true, office: true },
  })
  if (!a) throw new AppError(404, 'NOT_FOUND', 'Appointment not found')
  res.json({
    success: true,
    data: {
      reference_number: a.referenceNumber,
      consumer_name: a.consumerName,
      account_name: a.accountName,
      account_number: a.accountNumber,
      email: a.email,
      concern_type: a.concernType.name,
      office: a.office.name,
      office_address: a.office.address,
      office_id: a.officeId,
      appointment_date: a.appointmentDate,
      start_time: a.startTime,
      end_time: a.endTime,
      status: a.status,
      created_at: a.createdAt,
    },
  })
}))

router.put('/:reference_number/reschedule', asyncHandler(async (req, res) => {
  const { new_date, new_start_time } = req.body
  const a = await prisma.appointment.findUnique({ where: { referenceNumber: req.params.reference_number } })
  if (!a) throw new AppError(404, 'NOT_FOUND', 'Appointment not found')
  if (['cancelled', 'completed'].includes(a.status)) throw new AppError(400, 'BAD_REQUEST', 'Cannot reschedule')
  if (a.rescheduleCount >= 2) throw new AppError(400, 'MAX_RESCHEDULE', 'Maximum reschedule limit')
  const oldD = a.appointmentDate, oldT = a.startTime

  const o = await prisma.office.findUnique({ where: { id: a.officeId } })
  const [h, m] = new_start_time.split(':').map(Number)
  const end = new Date(2024, 0, 1, h, m + o.appointmentDurationMinutes)
  const et = String(end.getHours()).padStart(2,'0')+':'+String(end.getMinutes()).padStart(2,'0')+':00'
  const cleanDate = new_date.slice(0, 10)

  const s = await prisma.timeSlot.findUnique({
    where: { officeId_slotDate_startTime: { officeId: a.officeId, slotDate: cleanDate, startTime: new_start_time } },
  })
  if (!s || s.bookedCount >= s.maxCapacity) throw new AppError(409, 'SLOT_FULL', 'Slot unavailable')

  await prisma.$transaction([
    prisma.timeSlot.updateMany({
      where: { officeId: a.officeId, slotDate: oldD, startTime: oldT },
      data: { bookedCount: { decrement: 1 } },
    }),
    prisma.timeSlot.update({ where: { id: s.id }, data: { bookedCount: { increment: 1 } } }),
    prisma.appointment.update({
      where: { id: a.id },
      data: {
        appointmentDate: cleanDate,
        startTime: new_start_time,
        endTime: et,
        status: 'rescheduled',
        rescheduleCount: { increment: 1 },
        rescheduledAt: new Date().toISOString(),
      },
    }),
  ])

  res.json({ success: true, data: { reference_number: a.referenceNumber, status: 'rescheduled', message: 'Appointment rescheduled successfully' } })
}))

router.put('/:reference_number/cancel', asyncHandler(async (req, res) => {
  const a = await prisma.appointment.findUnique({ where: { referenceNumber: req.params.reference_number } })
  if (!a) throw new AppError(404, 'NOT_FOUND', 'Appointment not found')

  await prisma.$transaction([
    prisma.timeSlot.updateMany({
      where: { officeId: a.officeId, slotDate: a.appointmentDate, startTime: a.startTime },
      data: { bookedCount: { decrement: 1 } },
    }),
    prisma.appointment.update({
      where: { id: a.id },
      data: { status: 'cancelled', updatedAt: new Date().toISOString() },
    }),
  ])

  res.json({ success: true, data: { reference_number: a.referenceNumber, status: 'cancelled', message: 'Appointment cancelled successfully' } })
}))

module.exports = router
