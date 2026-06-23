const express = require('express')
const prisma = require('../db/database')
const { authenticate } = require('../middleware/auth')

const router = express.Router()

const appointmentSelect = { id: true, referenceNumber: true, consumerName: true, accountNumber: true, appointmentDate: true, startTime: true, endTime: true, status: true, createdAt: true }

function buildFilters(req) {
  const where = {}
  if (req.admin.role === 'office_manager' || req.admin.role === 'staff') {
    where.officeId = req.admin.officeId
  }
  return where
}

router.get('/', authenticate, async (req, res) => {
  const { status, office_id, date_from, date_to, search, page = 1, per_page = 20, sort_by = 'created_at', sort_order = 'desc' } = req.query
  const offset = (Number(page) - 1) * Number(per_page)
  const where = buildFilters(req)

  if (status) where.status = status
  if (office_id) where.officeId = Number(office_id)
  if (date_from) where.appointmentDate = { ...where.appointmentDate, gte: date_from }
  if (date_to) where.appointmentDate = { ...where.appointmentDate, lte: date_to }
  if (search) {
    const q = `%${search}%`
    where.OR = [
      { referenceNumber: { contains: search } },
      { consumerName: { contains: search } },
      { accountNumber: { contains: search } },
      { mobileNumber: { contains: search } },
    ]
  }

  const sortMap = { created_at: 'createdAt', appointment_date: 'appointmentDate', consumer_name: 'consumerName', status: 'status' }
  const orderBy = { [sortMap[sort_by] || 'createdAt']: sort_order === 'asc' ? 'asc' : 'desc' }

  const [total, appointments] = await Promise.all([
    prisma.appointment.count({ where }),
    prisma.appointment.findMany({
      where,
      select: { ...appointmentSelect, concernType: { select: { name: true } }, office: { select: { name: true } } },
      orderBy,
      skip: offset,
      take: Number(per_page),
    }),
  ])

  const lastPage = Math.ceil(total / Number(per_page))
  res.json({
    success: true,
    data: {
      appointments: appointments.map(a => ({
        id: a.id,
        reference_number: a.referenceNumber,
        consumer_name: a.consumerName,
        account_number: a.accountNumber,
        concern_type: a.concernType.name,
        office: a.office.name,
        appointment_date: a.appointmentDate,
        start_time: a.startTime,
        end_time: a.endTime,
        status: a.status,
        created_at: a.createdAt,
      })),
      pagination: { current_page: Number(page), per_page: Number(per_page), total, last_page: lastPage || 1 },
    },
  })
})

router.get('/today', authenticate, async (req, res) => {
  const where = buildFilters(req)

  if (req.query.date_from && req.query.date_to) {
    where.appointmentDate = { gte: req.query.date_from, lte: req.query.date_to }
  } else {
    where.appointmentDate = req.query.date || new Date().toISOString().slice(0, 10)
  }

  const appointments = await prisma.appointment.findMany({
    where,
    include: { concernType: { select: { name: true } }, office: { select: { name: true } } },
    orderBy: [{ appointmentDate: 'asc' }, { startTime: 'asc' }],
  })

  res.json({
    success: true,
    data: appointments.map(a => ({
      id: a.id,
      reference_number: a.referenceNumber,
      consumer_name: a.consumerName,
      account_number: a.accountNumber,
      mobile_number: a.mobileNumber,
      email: a.email,
      concern_type: a.concernType.name,
      office: a.office.name,
      appointment_date: a.appointmentDate,
      start_time: a.startTime,
      end_time: a.endTime,
      status: a.status,
      admin_notes: a.adminNotes,
    })),
  })
})

router.get('/:id', authenticate, async (req, res) => {
  const appt = await prisma.appointment.findUnique({
    where: { id: Number(req.params.id) },
    include: { concernType: { select: { name: true } }, office: true },
  })

  if (!appt) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Appointment not found' } })
  if ((req.admin.role === 'office_manager' || req.admin.role === 'staff') && appt.officeId !== req.admin.officeId) {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } })
  }

  const [auditLogs, notifications] = await Promise.all([
    prisma.auditLog.findMany({ where: { appointmentId: appt.id }, orderBy: { createdAt: 'asc' } }),
    prisma.notification.findMany({ where: { appointmentId: appt.id }, orderBy: { createdAt: 'desc' } }),
  ])

  res.json({
    success: true,
    data: {
      id: appt.id,
      reference_number: appt.referenceNumber,
      consumer_name: appt.consumerName,
      account_name: appt.accountName,
      account_number: appt.accountNumber,
      mobile_number: appt.mobileNumber,
      email: appt.email,
      concern_type: appt.concernType.name,
      office: appt.office.name,
      appointment_date: appt.appointmentDate,
      start_time: appt.startTime,
      end_time: appt.endTime,
      status: appt.status,
      admin_notes: appt.adminNotes,
      reschedule_count: appt.rescheduleCount,
      created_at: appt.createdAt,
      notifications,
      audit_trail: auditLogs,
    },
  })
})

router.put('/:id/notes', authenticate, async (req, res) => {
  const { notes } = req.body
  if (notes === undefined || notes === null) {
    return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Notes are required' } })
  }
  const appt = await prisma.appointment.findUnique({ where: { id: Number(req.params.id) } })
  if (!appt) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Appointment not found' } })
  if ((req.admin.role === 'office_manager' || req.admin.role === 'staff') && appt.officeId !== req.admin.officeId) {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } })
  }

  await prisma.appointment.update({ where: { id: appt.id }, data: { adminNotes: notes } })
  res.json({ success: true, data: { id: appt.id, admin_notes: notes } })
})

router.put('/:id/status', authenticate, async (req, res) => {
  const { status, notes } = req.body
  const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no_show', 'archived']
  if (!validStatuses.includes(status)) return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid status' } })

  const appt = await prisma.appointment.findUnique({ where: { id: Number(req.params.id) } })
  if (!appt) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Appointment not found' } })
  if ((req.admin.role === 'office_manager' || req.admin.role === 'staff') && appt.officeId !== req.admin.officeId) {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } })
  }

  const oldStatus = appt.status
  const operations = []

  if (['cancelled', 'no_show', 'archived'].includes(status)) {
    operations.push(
      prisma.timeSlot.updateMany({
        where: { officeId: appt.officeId, slotDate: appt.appointmentDate, startTime: appt.startTime },
        data: { bookedCount: { decrement: 1 } },
      })
    )
  }

  if (['cancelled', 'no_show', 'archived', 'completed'].includes(oldStatus) && status === 'pending') {
    operations.push(
      prisma.timeSlot.findUnique({
        where: { officeId_slotDate_startTime: { officeId: appt.officeId, slotDate: appt.appointmentDate, startTime: appt.startTime } },
      }).then(slot => {
        if (slot && slot.bookedCount < slot.maxCapacity) {
          return prisma.timeSlot.update({ where: { id: slot.id }, data: { bookedCount: { increment: 1 } } })
        }
      })
    )
  }

  const completedAt = status === 'completed' ? new Date().toISOString() : null

  operations.push(
    prisma.appointment.update({
      where: { id: appt.id },
      data: {
        status,
        adminNotes: notes || undefined,
        completedAt,
        processedBy: req.admin.id,
        updatedAt: new Date().toISOString(),
      },
    }),
    prisma.auditLog.create({
      data: {
        appointmentId: appt.id,
        adminId: req.admin.id,
        action: 'STATUS_CHANGED',
        entityType: 'appointment',
        entityId: appt.id,
        oldValues: JSON.stringify({ status: oldStatus }),
        newValues: JSON.stringify({ status, notes }),
      },
    })
  )

  await prisma.$transaction(operations)
  res.json({ success: true, data: { id: appt.id, status }, message: `Appointment status updated to ${status}` })
})

router.put('/:id/reschedule', authenticate, async (req, res) => {
  const { new_appointment_date, new_start_time, notes } = req.body
  const appt = await prisma.appointment.findUnique({ where: { id: Number(req.params.id) } })
  if (!appt) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Appointment not found' } })
  if ((req.admin.role === 'office_manager' || req.admin.role === 'staff') && appt.officeId !== req.admin.officeId) {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } })
  }

  const office = await prisma.office.findUnique({ where: { id: appt.officeId } })
  const [h, m] = new_start_time.split(':').map(Number)
  const endDate = new Date(2024, 0, 1, h, m + office.appointmentDurationMinutes)
  const end_time = String(endDate.getHours()).padStart(2, '0') + ':' + String(endDate.getMinutes()).padStart(2, '0') + ':00'
  const cleanDate = new_appointment_date.slice(0, 10)

  const slot = await prisma.timeSlot.findUnique({
    where: { officeId_slotDate_startTime: { officeId: appt.officeId, slotDate: cleanDate, startTime: new_start_time } },
  })

  await prisma.$transaction([
    prisma.timeSlot.updateMany({
      where: { officeId: appt.officeId, slotDate: appt.appointmentDate, startTime: appt.startTime },
      data: { bookedCount: { decrement: 1 } },
    }),
    ...(slot ? [prisma.timeSlot.update({ where: { id: slot.id }, data: { bookedCount: { increment: 1 } } })] : []),
    prisma.appointment.update({
      where: { id: appt.id },
      data: {
        appointmentDate: cleanDate,
        startTime: new_start_time,
        endTime: end_time,
        status: 'rescheduled',
        rescheduleCount: { increment: 1 },
        rescheduledAt: new Date().toISOString(),
        adminNotes: notes || undefined,
        updatedAt: new Date().toISOString(),
      },
    }),
    prisma.auditLog.create({
      data: {
        appointmentId: appt.id,
        adminId: req.admin.id,
        action: 'APPOINTMENT_RESCHEDULED',
        entityType: 'appointment',
        entityId: appt.id,
        newValues: JSON.stringify({ date: new_appointment_date, time: new_start_time, reason: notes }),
      },
    }),
  ])

  res.json({ success: true, data: { reference_number: appt.referenceNumber, status: 'rescheduled' } })
})

router.delete('/:id', authenticate, async (req, res) => {
  if (req.admin.role !== 'super_admin') {
    return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Only super admins can delete appointments' } })
  }
  const appt = await prisma.appointment.findUnique({ where: { id: Number(req.params.id) } })
  if (!appt) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Appointment not found' } })

  await prisma.$transaction([
    prisma.timeSlot.updateMany({
      where: { officeId: appt.officeId, slotDate: appt.appointmentDate, startTime: appt.startTime },
      data: { bookedCount: { decrement: 1 } },
    }),
    prisma.notification.deleteMany({ where: { appointmentId: appt.id } }),
    prisma.auditLog.deleteMany({ where: { appointmentId: appt.id } }),
    prisma.appointment.delete({ where: { id: appt.id } }),
  ])

  res.json({ success: true, message: 'Appointment deleted permanently' })
})

module.exports = router
