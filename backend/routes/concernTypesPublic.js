const express = require('express')
const prisma = require('../db/database')

const concernTypesRouter = express.Router()
concernTypesRouter.get('/', (req, res) => {
  prisma.concernType.findMany({
    where: { isActive: true },
    select: { id: true, name: true, code: true, description: true, estimatedDurationMinutes: true },
    orderBy: { sortOrder: 'asc' },
  }).then(types => res.json({ success: true, data: types }))
})

module.exports = concernTypesRouter
