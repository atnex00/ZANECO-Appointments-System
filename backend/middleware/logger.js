// Database-backed logger
// Writes request logs to the `request_logs` table.
// Keeps console output in dev mode for live debugging.

const config = require('../config')
const db = require('../db/database')

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

// Express middleware — logs each request to the database
function requestLogger(req, res, next) {
  const start = Date.now()

  // Capture the original end to intercept the response
  const originalEnd = res.end
  let body = ''

  res.end = function (...args) {
    const duration = Date.now() - start

    // Log to database (fire-and-forget)
    try {
      const bodyPreview = req.body ? JSON.stringify(req.body).slice(0, 500) : null
      db.prepare(
        'INSERT INTO request_logs (method, url, status, duration_ms, ip, user_agent, admin_id, body_preview, error_message) VALUES (?,?,?,?,?,?,?,?,?)'
      ).run(
        req.method,
        req.originalUrl,
        res.statusCode,
        duration,
        req.ip,
        req.headers['user-agent'] || null,
        req.admin?.id || null,
        ['POST', 'PUT'].includes(req.method) ? bodyPreview : null,
        res.statusCode >= 400 ? res.statusMessage || null : null
      )
    } catch {}

    // Console output in dev
    if (!config.isProduction) {
      const ts = new Date().toISOString().slice(11, 19)
      console.log(`${ts} ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`)
    }

    originalEnd.apply(res, args)
  }

  next()
}

module.exports = { logger, requestLogger }
