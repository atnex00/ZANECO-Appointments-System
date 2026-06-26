const express = require('express')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const prisma = require('../db/database')
const config = require('../config')
const { AppError, asyncHandler } = require('../middleware/errors')
const { sendEmail, emailShell } = require('../services/emailService')
const Joi = require('joi')

const router = express.Router()

const forgotSchema = Joi.object({
  email: Joi.string().email().required(),
})

const resetSchema = Joi.object({
  token: Joi.string().hex().length(64).required(),
  password: Joi.string().min(8).max(128).required(),
})

router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { error, value } = forgotSchema.validate(req.body)
  if (error) throw new AppError(422, 'VALIDATION_ERROR', error.details[0].message)

  const { email } = value
  const admin = await prisma.administrator.findUnique({ where: { email } })

  if (admin) {
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

    await prisma.administrator.update({
      where: { id: admin.id },
      data: { resetToken: token, resetTokenExpiresAt: expiresAt },
    })

    const resetUrl = `${config.frontendUrl}/admin/reset-password?token=${token}`
    const html = emailShell(`
      <p style="margin: 0 0 16px; color: #374151; font-size: 15px; line-height: 1.6;">Dear <strong style="color: #111827;">${admin.fullName}</strong>,</p>
      <p style="margin: 0 0 20px; color: #374151; font-size: 15px; line-height: 1.6;">You requested a password reset. Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
      <div style="text-align: center; margin: 24px 0;">
        <a href="${resetUrl}" style="display: inline-block; background: #d97706; color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; letter-spacing: 0.03em;">Reset Password</a>
      </div>
      <p style="margin: 20px 0 0; color: #6b7280; font-size: 13px; line-height: 1.5;">If you did not request this, you can safely ignore this email. Your password will remain unchanged.</p>
    `, { subtitle: 'Password Reset' })

    await sendEmail({ to: admin.email, subject: 'Password Reset — ZANECO Appointments', html })
  } else {
    await new Promise(r => setTimeout(r, 200))
  }

  res.json({ success: true, message: 'If that email is registered, a reset link has been sent.' })
}))

router.post('/reset-password', asyncHandler(async (req, res) => {
  const { error, value } = resetSchema.validate(req.body)
  if (error) throw new AppError(422, 'VALIDATION_ERROR', error.details[0].message)

  const { token, password } = value
  const now = new Date().toISOString()

  const admin = await prisma.administrator.findFirst({
    where: { resetToken: token, resetTokenExpiresAt: { gt: now }, isActive: true },
  })

  if (!admin) throw new AppError(400, 'TOKEN_INVALID', 'Reset token is invalid or expired.')

  const passwordHash = bcrypt.hashSync(password, 10)

  await prisma.administrator.update({
    where: { id: admin.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpiresAt: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  })

  res.json({ success: true, message: 'Password reset successfully. You can now log in with your new password.' })
}))

module.exports = router
