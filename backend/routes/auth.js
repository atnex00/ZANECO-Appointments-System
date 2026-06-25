const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const prisma = require('../db/database')
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
  const admin = await prisma.administrator.findUnique({ where: { email } })
  const ipAddress = req.ip || req.connection?.remoteAddress || null
  const userAgent = req.headers['user-agent'] || null

  if (!admin || !admin.isActive) {
    await prisma.auditLog.create({
      data: {
        action: 'LOGIN_FAILED',
        entityType: 'administrator',
        ipAddress,
        userAgent,
      },
    })
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password')
  }

  if (admin.lockedUntil && new Date(admin.lockedUntil) > new Date()) {
    await prisma.auditLog.create({
      data: {
        action: 'ACCOUNT_LOCKED',
        entityType: 'administrator',
        entityId: admin.id,
        adminId: admin.id,
        ipAddress,
        userAgent,
      },
    })
    throw new AppError(423, 'ACCOUNT_LOCKED', 'Account is locked. Try again later.')
  }

  if (!bcrypt.compareSync(password, admin.passwordHash)) {
    const attempts = admin.failedLoginAttempts + 1
    if (attempts >= 5) {
      const lockUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString()
      await prisma.administrator.update({ where: { id: admin.id }, data: { failedLoginAttempts: attempts, lockedUntil } })
      await prisma.auditLog.create({
        data: {
          action: 'ACCOUNT_LOCKED',
          entityType: 'administrator',
          entityId: admin.id,
          adminId: admin.id,
          ipAddress,
          userAgent,
        },
      })
      throw new AppError(423, 'ACCOUNT_LOCKED', 'Account locked for 30 minutes.')
    }
    await prisma.administrator.update({ where: { id: admin.id }, data: { failedLoginAttempts: attempts } })
    await prisma.auditLog.create({
      data: {
        action: 'LOGIN_FAILED',
        entityType: 'administrator',
        entityId: admin.id,
        adminId: admin.id,
        ipAddress,
        userAgent,
      },
    })
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password')
  }

  await prisma.administrator.update({
    where: { id: admin.id },
    data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date().toISOString() },
  })

  await prisma.auditLog.create({
    data: {
      action: 'LOGIN_SUCCESS',
      entityType: 'administrator',
      entityId: admin.id,
      adminId: admin.id,
      ipAddress,
      userAgent,
    },
  })

  const token = jwt.sign({ sub: admin.id, email: admin.email, role: admin.role }, config.jwt.secret, { expiresIn: config.jwt.expiresIn })
  const refreshToken = (await import('uuid')).v4()
  await prisma.administrator.update({ where: { id: admin.id }, data: { refreshToken } })

  res.json({
    success: true,
    data: {
      token,
      refresh_token: refreshToken,
      expires_in: 3600,
      user: { id: admin.id, email: admin.email, full_name: admin.fullName, role: admin.role, office_id: admin.officeId },
    },
  })
}))

router.post('/refresh', asyncHandler(async (req, res) => {
  const { refresh_token } = req.body
  if (!refresh_token) throw new AppError(401, 'UNAUTHORIZED', 'Refresh token required')

  const admin = await prisma.administrator.findFirst({ where: { refreshToken: refresh_token, isActive: true } })
  if (!admin) throw new AppError(401, 'INVALID_TOKEN', 'Invalid refresh token')

  const token = jwt.sign({ sub: admin.id, email: admin.email, role: admin.role }, config.jwt.secret, { expiresIn: config.jwt.expiresIn })
  res.json({ success: true, data: { token, expires_in: 3600 } })
}))

router.post('/logout', asyncHandler(async (req, res) => {
  const header = req.headers.authorization
  if (header && header.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(header.slice(7), config.jwt.secret)
      await prisma.administrator.update({ where: { id: decoded.sub }, data: { refreshToken: null } })
    } catch (err) { console.error('Logout token cleanup failed:', err) }
  }
  res.json({ success: true, message: 'Logged out successfully' })
}))

module.exports = router
