const express = require('express')
const bcrypt = require('bcryptjs')
const db = require('../db/database')
const { authenticate } = require('../middleware/auth')
const { AppError, asyncHandler } = require('../middleware/errors')
const Joi = require('joi')

const router = express.Router()

const createSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(100).required(),
  full_name: Joi.string().trim().min(1).max(150).required(),
  role: Joi.string().valid('super_admin', 'office_manager', 'staff').required(),
  office_id: Joi.number().integer().allow(null).optional(),
  is_active: Joi.boolean().optional(),
})

router.get('/', authenticate, asyncHandler(async (req, res) => {
  if (req.admin.role !== 'super_admin') throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions')
  const admins = db.prepare("SELECT id, email, full_name, role, office_id, is_active, last_login_at FROM administrators ORDER BY full_name").all()
  res.json({ success: true, data: admins })
}))

router.post('/', authenticate, asyncHandler(async (req, res) => {
  if (req.admin.role !== 'super_admin') throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions')
  const { error, value } = createSchema.validate(req.body)
  if (error) throw new AppError(422, 'VALIDATION_ERROR', error.details[0].message)

  const existing = db.prepare('SELECT id FROM administrators WHERE email = ?').get(value.email)
  if (existing) throw new AppError(409, 'CONFLICT', 'Email already registered')

  const hash = bcrypt.hashSync(value.password, 10)
  const isActive = value.is_active !== undefined ? (value.is_active ? 1 : 0) : 1
  db.prepare('INSERT INTO administrators (email, password_hash, full_name, role, office_id, is_active) VALUES (?,?,?,?,?,?)').run(value.email, hash, value.full_name, value.role, value.office_id || null, isActive)
  res.status(201).json({ success: true, message: 'Admin created' })
}))

router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  if (req.admin.role !== 'super_admin') throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions')
  const fields = []
  const params = []
  for (const key of ['full_name', 'role', 'office_id']) {
    if (req.body[key] !== undefined) { fields.push(`${key} = ?`); params.push(req.body[key]) }
  }
  if (req.body.is_active !== undefined) { fields.push('is_active = ?'); params.push(req.body.is_active ? 1 : 0) }
  if (req.body.password) {
    fields.push('password_hash = ?')
    params.push(bcrypt.hashSync(req.body.password, 10))
  }
  if (!fields.length) throw new AppError(400, 'BAD_REQUEST', 'No fields to update')
  fields.push("updated_at = datetime('now')")
  params.push(req.params.id)
  db.prepare(`UPDATE administrators SET ${fields.join(', ')} WHERE id = ?`).run(...params)
  res.json({ success: true, message: 'Admin updated' })
}))

module.exports = router
