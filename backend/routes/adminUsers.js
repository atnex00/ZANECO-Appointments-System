const express = require('express')
const bcrypt = require('bcryptjs')
const prisma = require('../db/database')
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
  const admins = await prisma.administrator.findMany({
    select: { id: true, email: true, fullName: true, role: true, officeId: true, isActive: true, lastLoginAt: true },
    orderBy: { fullName: 'asc' },
  })
  res.json({ success: true, data: admins })
}))

router.post('/', authenticate, asyncHandler(async (req, res) => {
  if (req.admin.role !== 'super_admin') throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions')
  const { error, value } = createSchema.validate(req.body)
  if (error) throw new AppError(422, 'VALIDATION_ERROR', error.details[0].message)

  const existing = await prisma.administrator.findUnique({ where: { email: value.email } })
  if (existing) throw new AppError(409, 'CONFLICT', 'Email already registered')

  const hash = bcrypt.hashSync(value.password, 10)
  await prisma.administrator.create({
    data: {
      email: value.email,
      passwordHash: hash,
      fullName: value.full_name,
      role: value.role,
      officeId: value.office_id || null,
      isActive: value.is_active !== undefined ? value.is_active : true,
    },
  })
  res.status(201).json({ success: true, message: 'Admin created' })
}))

router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  if (req.admin.role !== 'super_admin') throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions')
  const data = {}
  for (const key of ['full_name', 'role', 'office_id']) {
    if (req.body[key] !== undefined) data[key] = req.body[key]
  }
  if (req.body.is_active !== undefined) data.is_active = req.body.is_active
  if (req.body.password) data.password_hash = bcrypt.hashSync(req.body.password, 10)
  if (!Object.keys(data).length) throw new AppError(400, 'BAD_REQUEST', 'No fields to update')

  await prisma.administrator.update({ where: { id: Number(req.params.id) }, data })
  res.json({ success: true, message: 'Admin updated' })
}))

module.exports = router
