const jwt = require('jsonwebtoken')
const prisma = require('../db/database')
const config = require('../config')
const { AppError } = require('./errors')

async function authenticate(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError(401, 'UNAUTHORIZED', 'Missing or invalid token'))
  }
  const token = header.slice(7)
  try {
    const decoded = jwt.verify(token, config.jwt.secret)
    const admin = await prisma.administrator.findUnique({
      where: { id: decoded.sub, isActive: true },
      select: { id: true, email: true, fullName: true, role: true, officeId: true, lockedUntil: true },
    })
    if (!admin) return next(new AppError(401, 'UNAUTHORIZED', 'Account not found'))
    if (admin.lockedUntil && new Date(admin.lockedUntil) > new Date()) {
      return next(new AppError(423, 'ACCOUNT_LOCKED', 'Account is locked'))
    }
    req.admin = admin
    next()
  } catch (err) {
    if (err.name === 'TokenExpiredError') return next(new AppError(401, 'TOKEN_EXPIRED', 'Token expired'))
    if (err.isOperational) return next(err)
    console.error('Auth error:', err)
    return next(new AppError(401, 'UNAUTHORIZED', 'Invalid token'))
  }
}

module.exports = { authenticate, JWT_SECRET: config.jwt.secret }
