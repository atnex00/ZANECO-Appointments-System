const config = require('../config')
const prisma = require('../db/database')

const logger = {
  info: (msg, meta = {}) => {
    if (!config.isProduction) {
      const ts = new Date().toISOString().slice(11, 19)
      const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : ''
      console.log(`${ts} INFO: ${msg}${metaStr}`)
    }
  },

  warn: (msg, meta = {}) => {
    const ts = new Date().toISOString().slice(11, 19)
    const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : ''
    console.warn(`${ts} WARN: ${msg}${metaStr}`)
  },

  error: (msg, meta = {}) => {
    const ts = new Date().toISOString().slice(11, 19)
    const stack = meta.stack ? '\n' + meta.stack : ''
    console.error(`${ts} ERROR: ${msg}${stack}`)
  },
}

function sanitize(v) {
  if (typeof v !== 'string') return v
  return v.replace(/\0/g, '')
}

function requestLogger(req, res, next) {
  const start = Date.now()
  const originalEnd = res.end

  res.end = function (...args) {
    const duration = Date.now() - start

    prisma.requestLog.create({
      data: {
        method: sanitize(req.method),
        url: sanitize(req.originalUrl),
        status: res.statusCode,
        durationMs: duration,
        ip: sanitize(req.ip),
        userAgent: sanitize(req.headers['user-agent']) || null,
        adminId: req.admin?.id || null,
        bodyPreview: ['POST', 'PUT'].includes(req.method) ? sanitize(JSON.stringify(req.body)).slice(0, 500) : null,
        errorMessage: res.statusCode >= 400 ? sanitize(res.statusMessage) || null : null,
      },
    }).catch(err => console.error('Audit log write failed:', err))

    if (!config.isProduction) {
      const ts = new Date().toISOString().slice(11, 19)
      console.log(`${ts} ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`)
    }

    originalEnd.apply(res, args)
  }

  next()
}

module.exports = { logger, requestLogger }
