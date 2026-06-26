const { Client } = require('pg')
const dotenv = require('dotenv')
const path = require('path')

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const tables = [
  'administrators', 'appointments', 'concern_types', 'office_schedules',
  'offices', 'time_slots', 'notifications', 'request_logs', 'booking_requests', 'audit_logs',
]

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()

  console.log('Fixing string timestamp values → real dates...')
  for (const table of tables) {
    for (const col of ['created_at', 'updated_at']) {
      try {
        const res = await client.query(`
          UPDATE "${table}"
          SET "${col}" = NOW()
          WHERE "${col}" = 'now()' OR "${col}" IS NULL OR "${col}" = ''
        `)
        if (res.rowCount > 0) console.log(`  ${table}.${col}: fixed ${res.rowCount} rows`)
      } catch (err) {
        if (!err.message.includes('does not exist')) console.error(`  ${table}.${col}: ${err.message}`)
      }
    }
  }

  console.log('Dropping old defaults and altering column types...')
  for (const table of tables) {
    for (const col of ['created_at', 'updated_at']) {
      try {
        await client.query(`ALTER TABLE "${table}" ALTER COLUMN "${col}" DROP DEFAULT`)
        await client.query(`
          ALTER TABLE "${table}" ALTER COLUMN "${col}" TYPE TIMESTAMP(3)
          USING "${col}"::timestamp
        `)
        await client.query(`ALTER TABLE "${table}" ALTER COLUMN "${col}" SET DEFAULT NOW()`)
        console.log(`  ${table}.${col}: migrated`)
      } catch (err) {
        if (err.message.includes('does not exist')) continue
        console.error(`  ${table}.${col} failed: ${err.message}`)
      }
    }
  }

  await client.end()
  console.log('Timestamp migration complete.')
}

main().catch(err => { console.error(err); process.exit(1) })
