const express = require('express')
const prisma = require('../db/database')
const { authenticate } = require('../middleware/auth')
const { generateReportPDF } = require('../services/pdfGenerator')
const { asyncHandler } = require('../middleware/errors')

const router = express.Router()

function dateFilter(req, res, next) {
  const { date_from, date_to, office_id, concern_type_id } = req.query
  req.filters = { date_from, date_to, office_id, concern_type_id }

  const conditions = []
  const params = []
  let p = 0

  if (req.admin.role === 'office_manager' || req.admin.role === 'staff') {
    conditions.push(`a.office_id = $${++p}`)
    params.push(req.admin.officeId)
  }
  if (date_from) { conditions.push(`a.appointment_date >= $${++p}`); params.push(date_from) }
  if (date_to) { conditions.push(`a.appointment_date <= $${++p}`); params.push(date_to) }
  if (office_id) { conditions.push(`a.office_id = $${++p}`); params.push(Number(office_id)) }
  if (concern_type_id) { conditions.push(`a.concern_type_id = $${++p}`); params.push(Number(concern_type_id)) }

  req.where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
  req.params = params
  next()
}

const QUERIES = {
  'appointments-by-office': `
    SELECT o.name AS office,
           COUNT(a.id) AS total,
           SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) AS completed,
           SUM(CASE WHEN a.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
           SUM(CASE WHEN a.status = 'rejected' THEN 1 ELSE 0 END) AS rejected,
           SUM(CASE WHEN a.status = 'no_show' THEN 1 ELSE 0 END) AS no_show,
           SUM(CASE WHEN a.status = 'rescheduled' THEN 1 ELSE 0 END) AS rescheduled,
           SUM(CASE WHEN a.status = 'pending' THEN 1 ELSE 0 END) AS pending,
           SUM(CASE WHEN a.status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed
    FROM offices o LEFT JOIN appointments a ON a.office_id = o.id ${'__WHERE__'}
    GROUP BY o.id, o.name ORDER BY total DESC`,

  'appointments-by-concern': `
    SELECT c.name AS concern_type, COUNT(a.id) AS total
    FROM concern_types c LEFT JOIN appointments a ON a.concern_type_id = c.id ${'__WHERE__'}
    GROUP BY c.id, c.name ORDER BY total DESC`,

  daily: `
    SELECT a.appointment_date, COUNT(*) AS total,
           SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) AS completed
    FROM appointments a ${'__WHERE__'}
    GROUP BY a.appointment_date ORDER BY a.appointment_date`,

  weekly: `
    SELECT CONCAT(SUBSTRING(a.appointment_date, 1, 4), '-', LPAD(EXTRACT(WEEK FROM a.appointment_date::date)::text, 2, '0')) AS week,
           COUNT(*) AS total,
           SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) AS completed
    FROM appointments a ${'__WHERE__'}
    GROUP BY week ORDER BY week`,

  monthly: `
    SELECT SUBSTRING(a.appointment_date, 1, 7) AS month,
           COUNT(*) AS total,
           SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) AS completed
    FROM appointments a ${'__WHERE__'}
    GROUP BY month ORDER BY month`,
}

router.get('/appointments-by-office', authenticate, dateFilter, asyncHandler(async (req, res) => {
  const sql = QUERIES['appointments-by-office'].replace('__WHERE__', req.where)
  const data = await prisma.$queryRawUnsafe(sql, ...req.params)
  res.json({ success: true, data })
}))

router.get('/appointments-by-concern', authenticate, dateFilter, asyncHandler(async (req, res) => {
  const sql = QUERIES['appointments-by-concern'].replace('__WHERE__', req.where)
  const data = await prisma.$queryRawUnsafe(sql, ...req.params)
  res.json({ success: true, data })
}))

router.get('/daily', authenticate, dateFilter, asyncHandler(async (req, res) => {
  const sql = QUERIES.daily.replace('__WHERE__', req.where)
  const data = await prisma.$queryRawUnsafe(sql, ...req.params)
  res.json({ success: true, data })
}))

router.get('/weekly', authenticate, dateFilter, asyncHandler(async (req, res) => {
  const sql = QUERIES.weekly.replace('__WHERE__', req.where)
  const data = await prisma.$queryRawUnsafe(sql, ...req.params)
  res.json({ success: true, data })
}))

router.get('/monthly', authenticate, dateFilter, asyncHandler(async (req, res) => {
  const sql = QUERIES.monthly.replace('__WHERE__', req.where)
  const data = await prisma.$queryRawUnsafe(sql, ...req.params)
  res.json({ success: true, data })
}))

router.get('/summary', authenticate, asyncHandler(async (req, res) => {
  const today = new Date().toISOString().split('T')[0]
  const monthStart = new Date(); monthStart.setDate(1); const ms = monthStart.toISOString().split('T')[0]
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay()); const ws = weekStart.toISOString().split('T')[0]
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7); const wa = weekAgo.toISOString().split('T')[0]

  const officeFilter = req.admin.role !== 'super_admin' && req.admin.officeId
    ? { officeId: req.admin.officeId }
    : {}

  const [totalToday, pending, completed, cancelled, rejected, no_show, totalMonth, totalWeek, weeklyTrend] = await Promise.all([
    prisma.appointment.count({ where: { appointmentDate: { startsWith: today }, ...officeFilter } }),
    prisma.appointment.count({ where: { status: 'pending', ...officeFilter } }),
    prisma.appointment.count({ where: { status: 'completed', ...officeFilter } }),
    prisma.appointment.count({ where: { status: 'cancelled', ...officeFilter } }),
    prisma.appointment.count({ where: { status: 'rejected', ...officeFilter } }),
    prisma.appointment.count({ where: { status: 'no_show', ...officeFilter } }),
    prisma.appointment.count({ where: { appointmentDate: { gte: ms }, ...officeFilter } }),
    prisma.appointment.count({ where: { appointmentDate: { gte: ws }, ...officeFilter } }),
    prisma.appointment.groupBy({
      by: ['appointmentDate'],
      where: { appointmentDate: { gte: wa, lte: today }, ...officeFilter },
      _count: { id: true },
      orderBy: { appointmentDate: 'asc' },
    }),
  ])

  res.json({
    success: true,
    data: {
      total_today: totalToday,
      total_week: totalWeek,
      total_month: totalMonth,
      pending,
      completed,
      cancelled,
      rejected,
      no_show,
      weekly_trend: weeklyTrend.map(w => ({ date: w.appointmentDate, count: w._count.id })),
    },
  })
}))

async function fetchReportData(type, where, params) {
  if (!QUERIES[type]) throw new Error('Invalid report type')
  const sql = QUERIES[type].replace('__WHERE__', where)
  return await prisma.$queryRawUnsafe(sql, ...params)
}

router.get('/export', authenticate, dateFilter, asyncHandler(async (req, res) => {
  const { type, format } = req.query
  if (!type) return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Report type required' } })

  try {
    const data = await fetchReportData(type, req.where, req.params)

    const title = req.filters?.date_from
      ? `${type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())} (${req.filters.date_from} to ${req.filters.date_to})`
      : `${type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}`

    if (format === 'csv') {
      const headers = Object.keys(data[0] || {}).join(',')
      const rows = data.map(r => Object.values(r).join(',')).join('\n')
      res.setHeader('Content-Type', 'text/csv')
      res.setHeader('Content-Disposition', `attachment; filename=zaneco-report-${type}.csv`)
      return res.send(headers + '\n' + rows)
    }

    if (format === 'pdf') {
      const columns = data.length ? Object.keys(data[0]) : []
      const dateRange = req.filters?.date_from ? `${req.filters.date_from} to ${req.filters.date_to}` : 'All time'
      const pdfBuffer = await generateReportPDF(title, columns, data, dateRange)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename=zaneco-report-${type}.pdf`)
      return res.send(pdfBuffer)
    }

    res.json({ success: true, data })
  } catch (err) {
    if (err.message.startsWith('Invalid report type')) {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Invalid report type' } })
    }
    console.error('Export error:', err)
    res.status(500).json({ success: false, error: { code: 'EXPORT_ERROR', message: err.message } })
  }
}))

module.exports = router
