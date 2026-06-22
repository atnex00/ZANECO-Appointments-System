const express = require('express')
const { prepare } = require('../db/database')

// Public endpoints
const concernTypesRouter = express.Router()
concernTypesRouter.get('/', (req, res) => {
  const types = prepare('SELECT id, name, code, description, estimated_duration_minutes FROM concern_types WHERE is_active = 1 ORDER BY sort_order').all()
  res.json({ success: true, data: types })
})

module.exports = concernTypesRouter

