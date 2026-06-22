const express = require('express')
const { prepare } = require('../db/database')
const { authenticate } = require('../middleware/auth')

const router = express.Router()

router.get('/', authenticate, (req, res) => {
  const { appointment_id, admin_id, action, date_from, date_to, page = 1, per_page = 50 } = req.query
  const offset = (page - 1) * per_page
  const where = ['1=1']
  const params = []

  if (appointment_id) { where.push('al.appointment_id = ?'); params.push(appointment_id) }
  if (admin_id) { where.push('al.admin_id = ?'); params.push(admin_id) }
  if (action) { where.push('al.action = ?'); params.push(action) }
  if (date_from) { where.push('al.created_at >= ?'); params.push(date_from) }
  if (date_to) { where.push('al.created_at <= ?'); params.push(date_to) }

  const total = prepare(`SELECT COUNT(*) AS c FROM audit_logs al WHERE ${where.join(' AND ')}`).get(...params).c

  const logs = prepare(`
    SELECT al.*, adm.full_name AS admin_name
    FROM audit_logs al
    LEFT JOIN administrators adm ON al.admin_id = adm.id
    WHERE ${where.join(' AND ')}
    ORDER BY al.created_at DESC LIMIT ? OFFSET ?
  `).all(...params, Number(per_page), Number(offset))

  res.json({ success: true, data: { audit_logs: logs, pagination: { current_page: Number(page), per_page: Number(per_page), total, last_page: Math.ceil(total / per_page) || 1 } } })
})

module.exports = router

