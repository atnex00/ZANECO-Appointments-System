const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../db/database')
const config = require('../config')
const { AppError, asyncHandler } = require('../middleware/errors')
const Joi = require('joi')

const router = express.Router()

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(1).required(),
})

router.post('/login', asyncHandler(async (req, res) => {
  const { error, value } = loginSchema.validate(req.body)
  if (error) throw new AppError(422, 'VALIDATION_ERROR', error.details[0].message)

  const { email, password } = value
  const admin = db.prepare('SELECT * FROM administrators WHERE email = ? AND is_active = 1').get(email)

  if (!admin) throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password')

  if (admin.locked_until && new Date(admin.locked_until) > new Date()) {
    throw new AppError(423, 'ACCOUNT_LOCKED', 'Account is locked. Try again later.')
  }

  if (!bcrypt.compareSync(password, admin.password_hash)) {
    const attempts = admin.failed_login_attempts + 1
    if (attempts >= 5) {
      const lockUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString()
      db.prepare('UPDATE administrators SET failed_login_attempts = ?, locked_until = ? WHERE id = ?').run(attempts, lockUntil, admin.id)
      throw new AppError(423, 'ACCOUNT_LOCKED', 'Account locked for 30 minutes.')
    }
    db.prepare('UPDATE administrators SET failed_login_attempts = ? WHERE id = ?').run(attempts, admin.id)
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password')
  }

  db.prepare('UPDATE administrators SET failed_login_attempts = 0, locked_until = NULL, last_login_at = datetime(?) WHERE id = ?').run(new Date().toISOString(), admin.id)

  const token = jwt.sign({ sub: admin.id, email: admin.email, role: admin.role }, config.jwt.secret, { expiresIn: config.jwt.expiresIn })
  const refreshToken = require('uuid').v4()
  db.prepare('UPDATE administrators SET refresh_token = ? WHERE id = ?').run(refreshToken, admin.id)

  res.json({
    success: true,
    data: {
      token,
      refresh_token: refreshToken,
      expires_in: 3600,
      user: { id: admin.id, email: admin.email, full_name: admin.full_name, role: admin.role, office_id: admin.office_id },
    },
  })
}))

router.post('/refresh', asyncHandler(async (req, res) => {
  const { refresh_token } = req.body
  if (!refresh_token) throw new AppError(401, 'UNAUTHORIZED', 'Refresh token required')

  const admin = db.prepare('SELECT * FROM administrators WHERE refresh_token = ? AND is_active = 1').get(refresh_token)
  if (!admin) throw new AppError(401, 'INVALID_TOKEN', 'Invalid refresh token')

  const token = jwt.sign({ sub: admin.id, email: admin.email, role: admin.role }, config.jwt.secret, { expiresIn: config.jwt.expiresIn })
  res.json({ success: true, data: { token, expires_in: 3600 } })
}))

router.post('/logout', (req, res) => {
  const header = req.headers.authorization
  if (header && header.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(header.slice(7), config.jwt.secret)
      db.prepare('UPDATE administrators SET refresh_token = NULL WHERE id = ?').run(decoded.sub)
    } catch {}
  }
  res.json({ success: true, message: 'Logged out successfully' })
})

module.exports = router
