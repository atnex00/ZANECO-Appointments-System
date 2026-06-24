const { PrismaClient } = require('@prisma/client')
const config = require('../config')

const dbUrl = new URL(config.db.url)
dbUrl.searchParams.set('connection_limit', '10')
dbUrl.searchParams.set('pool_timeout', '10')

const prisma = new PrismaClient({
  datasources: { db: { url: dbUrl.toString() } },
  log: config.isProduction ? ['error', 'warn'] : ['query', 'info', 'warn', 'error'],
})

async function init() {
  const MAX_RETRIES = 3
  const RETRY_DELAY = 2000
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await prisma.$connect()
      console.log('Database connected')
      return
    } catch (err) {
      console.error(`Database connection attempt ${attempt}/${MAX_RETRIES} failed:`, err.message)
      if (attempt === MAX_RETRIES) throw err
      await new Promise(r => setTimeout(r, RETRY_DELAY))
    }
  }
}

module.exports = prisma
module.exports.init = init
