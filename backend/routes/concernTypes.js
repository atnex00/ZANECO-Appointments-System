const express = require('express')
const prisma = require('../db/database')
const { authenticate } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errors')

const router = express.Router()

router.get('/', authenticate, asyncHandler(async (req, res) => {
  const types = await prisma.concernType.findMany({ orderBy: { sortOrder: 'asc' } })
  res.json({ success: true, data: types })
}))

router.post('/', authenticate, asyncHandler(async (req, res) => {
  if (req.admin.role !== 'super_admin') return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } })
  const { name, code, description, estimated_duration_minutes, is_active, sort_order } = req.body
  if (!name || !code) return res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Name and code required' } })

  await prisma.concernType.create({
    data: {
      name,
      code,
      description: description || null,
      estimatedDurationMinutes: estimated_duration_minutes || 30,
      isActive: is_active !== undefined ? is_active : true,
      sortOrder: sort_order || 0,
    },
  })
  res.status(201).json({ success: true, message: 'Concern type created' })
}))

router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  if (req.admin.role !== 'super_admin') return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } })

  const FIELD_MAP = {
    estimated_duration_minutes: 'estimatedDurationMinutes',
    sort_order: 'sortOrder',
    is_active: 'isActive',
  }

  const update = {}
  for (const key of ['name', 'code', 'description', 'estimated_duration_minutes', 'sort_order', 'is_active']) {
    if (req.body[key] !== undefined) update[FIELD_MAP[key] || key] = req.body[key]
  }
  if (!Object.keys(update).length) return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'No fields' } })

  await prisma.concernType.update({ where: { id: Number(req.params.id) }, data: update })
  res.json({ success: true, message: 'Concern type updated' })
}))

module.exports = router
