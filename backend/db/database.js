const { PrismaClient } = require('@prisma/client')
const config = require('../config')

const prisma = new PrismaClient({
  datasources: { db: { url: config.db.url } },
})

async function init() {
  await prisma.$connect()
  console.log('Database connected')
}

module.exports = prisma
module.exports.init = init
