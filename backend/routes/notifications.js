const express = require('express')
const { prepare } = require('../db/database')
const { authenticate } = require('../middleware/auth')

const router = express.Router()

router.get('/', authenticate, (req, res) => {
  const { status, page = 1, per_page = 50 } = req.query
  const offset = (page - 1) * per_page
  let where = []
  let params = []
  if (status) { where.push('status = ?'); params.push(status) }
  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : ''

  const total = prepare(`SELECT COUNT(*) AS c FROM notifications ${whereClause}`).get(...params).c
  const notifications = prepare(`SELECT * FROM notifications ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, Number(per_page), Number(offset))

  res.json({ success: true, data: { notifications, pagination: { current_page: Number(page), per_page: Number(per_page), total, last_page: Math.ceil(total / per_page) || 1 } } })
})

router.post('/resend/:id', authenticate, (req, res) => {
  const notif = prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.id)
  if (!notif) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Notification not found' } })
  prepare("UPDATE notifications SET status = 'pending', retry_count = 0 WHERE id = ?").run(notif.id)
  res.json({ success: true, message: 'Notification queued for resend' })
})

module.exports = router

