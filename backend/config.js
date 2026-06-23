// Validated environment configuration
const dotenv = require('dotenv')
const path = require('path')
const fs = require('fs')

// Load .env file
const envPath = path.join(__dirname, '.env')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
  console.log('Config loaded from .env')
} else {
  console.log('No .env file found, using defaults (dev mode)')
}

const config = {
  port: parseInt(process.env.PORT, 10) || 8000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: (process.env.NODE_ENV || 'development') === 'production',

  jwt: {
    secret: process.env.JWT_SECRET || 'zaneco-dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },

  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },

  db: {
    path: process.env.DB_PATH || './data/zaneco.db',
    // PostgreSQL settings for future migration
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },

  sms: {
    twilioSid: process.env.TWILIO_ACCOUNT_SID || '',
    twilioToken: process.env.TWILIO_AUTH_TOKEN || '',
    fromNumber: process.env.TWILIO_FROM_NUMBER || '',
  },

  email: {
    smtpHost: process.env.SMTP_HOST || '',
    smtpPort: parseInt(process.env.SMTP_PORT, 10) || 587,
    smtpSecure: process.env.SMTP_SECURE === 'true',
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    sendgridKey: process.env.SENDGRID_API_KEY || '',
    from: process.env.EMAIL_FROM || 'noreply@zaneco.ph',
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
    max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 5,
  },

  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
}

// Production checks
if (config.isProduction) {
  const warnings = []
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'change-this-to-a-random-64-char-string') {
    warnings.push('JWT_SECRET is not set or is using the default value')
  }
  if (config.cors.origin === '*') {
    warnings.push('CORS_ORIGIN is set to wildcard — restrict to your domain')
  }
  if (warnings.length) {
    console.warn('Production config warnings:')
    warnings.forEach(w => console.warn('  ⚠ ' + w))
  }
}

module.exports = config
