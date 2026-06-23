const express = require('express')
const { prepare } = require('../db/database')
const { authenticate } = require('../middleware/auth')
const { generateReportPDF } = require('../services/pdfGenerator')

const router = express.Router()

function dateFilter(table, alias) {
  return (req, res, next) => {
    const { date_from, date_to, office_id, concern_type_id } = req.query
    req.filters = { date_from, date_to, office_id, concern_type_id }

    let where = []
    let params = []

    if (req.admin.role === 'office_manager' || req.admin.role === 'staff') {
      where.push(`${alias || 'a'}.office_id = ?`)
      params.push(req.admin.office_id)
    }
    if (date_from) { where.push(`${alias || 'a'}.appointment_date >= ?`); params.push(date_from) }
    if (date_to) { where.push(`${alias || 'a'}.appointment_date <= ?`); params.push(date_to) }
    if (office_id) { where.push(`${alias || 'a'}.office_id = ?`); params.push(office_id) }
    if (concern_type_id) { where.push(`${alias || 'a'}.concern_type_id = ?`); params.push(concern_type_id) }

    req.where = where.length ? 'WHERE ' + where.join(' AND ') : ''
    req.params = params
    next()
  }
}

router.get('/appointments-by-office', authenticate, dateFilter(), (req, res) => {
  const data = prepare(`
    SELECT o.name AS office,
           COUNT(a.id) AS total,
           SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) AS completed,
           SUM(CASE WHEN a.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
           SUM(CASE WHEN a.status = 'no_show' THEN 1 ELSE 0 END) AS no_show,
           SUM(CASE WHEN a.status = 'rescheduled' THEN 1 ELSE 0 END) AS rescheduled,
           SUM(CASE WHEN a.status = 'pending' THEN 1 ELSE 0 END) AS pending,
           SUM(CASE WHEN a.status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed
    FROM offices o
    LEFT JOIN appointments a ON a.office_id = o.id ${req.where}
    GROUP BY o.id, o.name
    ORDER BY total DESC
  `).all(...req.params)
  res.json({ success: true, data })
})

router.get('/appointments-by-concern', authenticate, dateFilter(), (req, res) => {
  const data = prepare(`
    SELECT c.name AS concern_type, COUNT(a.id) AS total
    FROM concern_types c
    LEFT JOIN appointments a ON a.concern_type_id = c.id ${req.where}
    GROUP BY c.id, c.name
    ORDER BY total DESC
  `).all(...req.params)
  res.json({ success: true, data })
})

router.get('/daily', authenticate, dateFilter(), (req, res) => {
  const data = prepare(`
    SELECT appointment_date, COUNT(*) AS total,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed
    FROM appointments a ${req.where}
    GROUP BY appointment_date
    ORDER BY appointment_date
  `).all(...req.params)
  res.json({ success: true, data })
})

router.get('/weekly', authenticate, dateFilter(), (req, res) => {
  const data = prepare(`
    SELECT STRFTIME('%Y-%W', appointment_date) AS week,
           COUNT(*) AS total,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed
    FROM appointments a ${req.where}
    GROUP BY week
    ORDER BY week
  `).all(...req.params)
  res.json({ success: true, data })
})

router.get('/monthly', authenticate, dateFilter(), (req, res) => {
  const data = prepare(`
    SELECT STRFTIME('%Y-%m', appointment_date) AS month,
           COUNT(*) AS total,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed
    FROM appointments a ${req.where}
    GROUP BY month
    ORDER BY month
  `).all(...req.params)
  res.json({ success: true, data })
})

router.get('/summary', authenticate, (req, res) => {
  const today = new Date().toISOString().split('T')[0]
  const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const monthStart = new Date(); monthStart.setDate(1)

  const totalToday = prepare("SELECT COUNT(*) AS c FROM appointments WHERE DATE(appointment_date) = ?").get(today).c
  const pending = prepare("SELECT COUNT(*) AS c FROM appointments WHERE status = 'pending'").get().c
  const completed = prepare("SELECT COUNT(*) AS c FROM appointments WHERE status = 'completed'").get().c
  const cancelled = prepare("SELECT COUNT(*) AS c FROM appointments WHERE status = 'cancelled'").get().c
  const no_show = prepare("SELECT COUNT(*) AS c FROM appointments WHERE status = 'no_show'").get().c
  const totalMonth = prepare("SELECT COUNT(*) AS c FROM appointments WHERE appointment_date >= ?").get(monthStart.toISOString().split('T')[0]).c
  const totalWeek = prepare("SELECT COUNT(*) AS c FROM appointments WHERE appointment_date >= ?").get(weekStart.toISOString().split('T')[0]).c

  const weeklyTrend = prepare(`
    SELECT appointment_date AS date, COUNT(*) AS count
    FROM appointments WHERE appointment_date >= date('now', '-7 days')
    GROUP BY appointment_date ORDER BY appointment_date
  `).all()

  res.json({
    success: true,
    data: { total_today: totalToday, total_week: totalWeek, total_month: totalMonth, pending, completed, cancelled, no_show, weekly_trend: weeklyTrend },
  })
})

const queryMap = {
  'appointments-by-office': (where, params) => prepare(`
    SELECT o.name AS office,
           COUNT(a.id) AS total,
           SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) AS completed,
           SUM(CASE WHEN a.status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
            SUM(CASE WHEN a.status = 'no_show' THEN 1 ELSE 0 END) AS no_show,
            SUM(CASE WHEN a.status = 'rescheduled' THEN 1 ELSE 0 END) AS rescheduled,
            SUM(CASE WHEN a.status = 'pending' THEN 1 ELSE 0 END) AS pending,
            SUM(CASE WHEN a.status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed
    FROM offices o LEFT JOIN appointments a ON a.office_id = o.id ${where}
    GROUP BY o.id, o.name ORDER BY total DESC
  `).all(...params),
  'appointments-by-concern': (where, params) => prepare(`
    SELECT c.name AS concern_type, COUNT(a.id) AS total
    FROM concern_types c LEFT JOIN appointments a ON a.concern_type_id = c.id ${where}
    GROUP BY c.id, c.name ORDER BY total DESC
  `).all(...params),
  daily: (where, params) => prepare(`
    SELECT appointment_date, COUNT(*) AS total,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed
    FROM appointments a ${where} GROUP BY appointment_date ORDER BY appointment_date
  `).all(...params),
  weekly: (where, params) => prepare(`
    SELECT STRFTIME('%Y-%W', appointment_date) AS week,
           COUNT(*) AS total,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed
    FROM appointments a ${where} GROUP BY week ORDER BY week
  `).all(...params),
  monthly: (where, params) => prepare(`
    SELECT STRFTIME('%Y-%m', appointment_date) AS month,
           COUNT(*) AS total,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed
    FROM appointments a ${where} GROUP BY month ORDER BY month
  `).all(...params),
}

router.get('/export', authenticate, dateFilter(), async (req, res) => {
  const { type, format } = req.query
  if (!type) return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Report type required' } })

  if (!queryMap[type]) return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Invalid report type' } })

  const data = queryMap[type](req.where, req.params)

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
    try {
      const columns = data.length ? Object.keys(data[0]) : []
      const dateRange = req.filters?.date_from
        ? `${req.filters.date_from} to ${req.filters.date_to}`
        : 'All time'
      const pdfBuffer = await generateReportPDF(title, columns, data, dateRange)
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `attachment; filename=zaneco-report-${type}.pdf`)
      return res.send(pdfBuffer)
    } catch (err) {
      console.error('PDF generation error:', err)
      return res.status(500).json({ success: false, error: { code: 'PDF_ERROR', message: err.message || 'Failed to generate PDF' } })
    }
  }

  res.json({ success: true, data })
})

module.exports = router

