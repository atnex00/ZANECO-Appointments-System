const express = require('express')
const { prepare } = require('../db/database')
const { authenticate } = require('../middleware/auth')

const router = express.Router()

router.get('/', authenticate, (req, res) => {
  const types = prepare('SELECT * FROM concern_types ORDER BY sort_order').all()
  res.json({ success: true, data: types })
})

router.post('/', authenticate, (req, res) => {
  if (req.admin.role !== 'super_admin') return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } })
  const { name, code, description, estimated_duration_minutes, is_active, sort_order } = req.body
  if (!name || !code) return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Name and code required' } })

  prepare('INSERT INTO concern_types (name, code, description, estimated_duration_minutes, is_active, sort_order) VALUES (?,?,?,?,?,?)')
    .run(name, code, description, estimated_duration_minutes || 30, is_active !== undefined ? (is_active ? 1 : 0) : 1, sort_order || 0)
  res.status(201).json({ success: true, message: 'Concern type created' })
})

router.put('/:id', authenticate, (req, res) => {
  if (req.admin.role !== 'super_admin') return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } })
  const fields = []
  const params = []
  for (const key of ['name', 'code', 'description', 'estimated_duration_minutes', 'sort_order']) {
    if (req.body[key] !== undefined) { fields.push(`${key} = ?`); params.push(req.body[key]) }
  }
  if (req.body.is_active !== undefined) { fields.push('is_active = ?'); params.push(req.body.is_active ? 1 : 0) }
  if (fields.length === 0) return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'No fields' } })
  fields.push("updated_at = datetime('now')")
  params.push(req.params.id)
  prepare(`UPDATE concern_types SET ${fields.join(', ')} WHERE id = ?`).run(...params)
  res.json({ success: true, message: 'Concern type updated' })
})

module.exports = router

