const { prepare, init, save } = require('./database')
const bcrypt = require('bcryptjs')

async function runSeed() {
  await init()

// Seed concern types
const concernTypes = [
  { name: 'Clarification of Electric Bill Charges', code: 'BILL_CLARIFICATION', description: 'Questions regarding bill charges and billing calculations.', sort_order: 1 },
  { name: 'Report Account Concern', code: 'ACCOUNT_CONCERN', description: 'Reporting account-related issues and discrepancies.', sort_order: 2 },
]

const insertConcern = prepare('INSERT OR IGNORE INTO concern_types (name, code, description, sort_order) VALUES (?, ?, ?, ?)')
for (const ct of concernTypes) insertConcern.run(ct.name, ct.code, ct.description, ct.sort_order)

// Seed offices
const offices = [
  { name: 'Main Office', code: 'MAIN', address: 'Poblacion, Dipolog City', phone: '065-212-3456', email: 'main@zaneco.ph', slot_capacity: 3 },
  { name: 'Sindangan Area Services', code: 'SAS', address: 'Sindangan, Zamboanga del Norte', phone: '065-213-4567', email: 'sas@zaneco.ph', slot_capacity: 2 },
  { name: 'Liloy Area Services', code: 'LAS', address: 'Liloy, Zamboanga del Norte', phone: '065-214-5678', email: 'las@zaneco.ph', slot_capacity: 2 },
  { name: 'Piñan Area Services', code: 'PAS', address: 'Piñan, Zamboanga del Norte', phone: '065-215-6789', email: 'pas@zaneco.ph', slot_capacity: 2 },
  { name: 'Dipolog Area Services', code: 'DAS', address: 'Minaog, Dipolog City, Zamboanga del Norte', phone: '065-216-7890', email: 'das@zaneco.ph', slot_capacity: 2 },
]

const insertOffice = prepare('INSERT OR IGNORE INTO offices (name, code, address, phone, email, slot_capacity) VALUES (?, ?, ?, ?, ?, ?)')
for (const o of offices) insertOffice.run(o.name, o.code, o.address, o.phone, o.email, o.slot_capacity)

// Seed office schedules (Mon-Fri)
const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
const insertSchedule = prepare('INSERT OR IGNORE INTO office_schedules (office_id, day_of_week, opening_time, closing_time, is_working_day) VALUES (?, ?, ?, ?, ?)')
const allOffices = prepare('SELECT id FROM offices').all()
for (const office of allOffices) {
  for (const day of days) {
    insertSchedule.run(office.id, day, '08:00:00', '17:00:00', 1)
  }
}

// Seed admin accounts
const passwordHash = bcrypt.hashSync('admin123', 10)
const insertAdmin = prepare('INSERT OR IGNORE INTO administrators (email, password_hash, full_name, role, office_id) VALUES (?, ?, ?, ?, ?)')
insertAdmin.run('admin@zaneco.ph', passwordHash, 'System Administrator', 'super_admin', null)
insertAdmin.run('manager.main@zaneco.ph', passwordHash, 'Main Office Manager', 'office_manager', 1)
insertAdmin.run('staff.main@zaneco.ph', passwordHash, 'Main Office Staff', 'staff', 1)

// Generate time slots for next 30 days
const insertSlot = prepare('INSERT OR IGNORE INTO time_slots (office_id, slot_date, start_time, end_time, max_capacity) VALUES (?, ?, ?, ?, ?)')
const today = new Date()
const slotTimes = []
for (let h = 8; h < 17; h++) {
  slotTimes.push(`${String(h).padStart(2, '0')}:00:00`)
  if (h < 16 || (h === 16)) slotTimes.push(`${String(h).padStart(2, '0')}:30:00`)
}

for (const office of allOffices) {
  const officeData = prepare('SELECT slot_capacity, appointment_duration_minutes FROM offices WHERE id = ?').get(office.id)
  for (let d = 0; d < 30; d++) {
    const date = new Date(today)
    date.setDate(date.getDate() + d)
    const dayOfWeek = date.getDay()
    if (dayOfWeek === 0 || dayOfWeek === 6) continue

    const dateStr = date.toISOString().split('T')[0]
    for (let t = 0; t < slotTimes.length - 1; t++) {
      const startTime = slotTimes[t]
      const endTime = slotTimes[t + 1]
      insertSlot.run(office.id, dateStr, startTime, endTime, officeData.slot_capacity)
    }
  }
}

  save()
  console.log('Seed data inserted successfully')
}

runSeed().catch(console.error)

