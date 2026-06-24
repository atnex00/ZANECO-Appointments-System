const express = require('express')
const prisma = require('../db/database')
const { asyncHandler } = require('../middleware/errors')

const concernTypesRouter = express.Router()
concernTypesRouter.get('/', asyncHandler(async (req, res) => {
  const types = await prisma.concernType.findMany({
    where: { isActive: true },
    select: { id: true, name: true, code: true, description: true, estimatedDurationMinutes: true },
    orderBy: { sortOrder: 'asc' },
  })
  res.json({ success: true, data: types })
}))

module.exports = concernTypesRouter
