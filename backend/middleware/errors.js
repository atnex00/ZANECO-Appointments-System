// Centralized error handling middleware
const { logger } = require('./logger')
const config = require('../config')

class AppError extends Error {
  constructor(statusCode, code, message, details = null) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.details = details
    this.isOperational = true
  }
}

function errorHandler(err, req, res, next) {
  const logData = {
    code: err.code || 'UNEXPECTED_ERROR',
    statusCode: err.statusCode || 500,
    stack: err.stack,
    url: req?.originalUrl,
    method: req?.method,
  }
  if (err.details) logData.details = err.details
  logger.error(err.message, logData)

  if (err.isOperational) {
    const body = { success: false, error: { code: err.code, message: err.message } }
    if (err.details) body.error.details = err.details
    return res.status(err.statusCode).json(body)
  }

  const statusCode = err.statusCode || 500
  res.status(statusCode).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: config.isProduction ? 'An unexpected error occurred' : err.message,
    },
  })
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)
}

module.exports = { AppError, errorHandler, asyncHandler }
