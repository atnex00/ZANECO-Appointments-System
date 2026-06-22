const jwt = require('jsonwebtoken')
const db = require('../db/database')
const config = require('../config')
const { AppError } = require('./errors')

function authenticate(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Missing or invalid token'))
  }
  const token = header.slice(7)
  try {
    const decoded = jwt.verify(token, config.jwt.secret)
    const admin = db.prepare('SELECT id, email, full_name, role, office_id FROM administrators WHERE id = ? AND is_active = 1').get(decoded.sub)
    if (!admin) return next(new AppError(401, 'UNAUTHORIZED', 'Account not found'))
    req.admin = admin
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError(401, 'TOKEN_EXPIRED', 'Token expired'))
    }
    return next(new AppError(401, 'UNAUTHORIZED', 'Invalid token'))
  }
}

module.exports = { authenticate, JWT_SECRET: config.jwt.secret }
