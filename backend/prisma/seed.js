const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const dotenv = require('dotenv')
const path = require('path')

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const prisma = new PrismaClient()

async function runSeed() {
  // Seed concern types
  const concernTypes = [
    { name: 'Clarification of Electric Bill Charges', code: 'BILL_CLARIFICATION', description: 'Questions regarding bill charges and billing calculations.', sortOrder: 1 },
    { name: 'Report Account Concern', code: 'ACCOUNT_CONCERN', description: 'Reporting account-related issues and discrepancies.', sortOrder: 2 },
  ]

  for (const ct of concernTypes) {
    await prisma.concernType.upsert({
      where: { code: ct.code },
      update: {},
      create: ct,
    })
  }

  // Seed offices
  const offices = [
    { name: 'Main Office', code: 'MAIN', address: 'Poblacion, Dipolog City', phone: '065-212-3456', email: 'main@zaneco.ph', slotCapacity: 3 },
    { name: 'Sindangan Area Services', code: 'SAS', address: 'Sindangan, Zamboanga del Norte', phone: '065-213-4567', email: 'sas@zaneco.ph', slotCapacity: 2 },
    { name: 'Liloy Area Services', code: 'LAS', address: 'Liloy, Zamboanga del Norte', phone: '065-214-5678', email: 'las@zaneco.ph', slotCapacity: 2 },
    { name: 'Piñan Area Services', code: 'PAS', address: 'Piñan, Zamboanga del Norte', phone: '065-215-6789', email: 'pas@zaneco.ph', slotCapacity: 2 },
    { name: 'Dipolog Area Services', code: 'DAS', address: 'Minaog, Dipolog City, Zamboanga del Norte', phone: '065-216-7890', email: 'das@zaneco.ph', slotCapacity: 2 },
  ]

  for (const o of offices) {
    await prisma.office.upsert({
      where: { code: o.code },
      update: {},
      create: {
        name: o.name,
        code: o.code,
        address: o.address,
        phone: o.phone,
        email: o.email,
        slotCapacity: o.slotCapacity,
      },
    })
  }

  // Seed office schedules (Mon-Fri)
  const allOffices = await prisma.office.findMany()
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']

  for (const office of allOffices) {
    for (const day of days) {
      await prisma.officeSchedule.upsert({
        where: { officeId_dayOfWeek: { officeId: office.id, dayOfWeek: day } },
        update: {},
        create: {
          officeId: office.id,
          dayOfWeek: day,
          openingTime: '08:00:00',
          closingTime: '17:00:00',
          isWorkingDay: true,
        },
      })
    }
  }

  // Seed admin accounts
  const passwordHash = bcrypt.hashSync('admin123', 10)
  const adminAccounts = [
    { email: 'admin@zaneco.ph', password_hash: passwordHash, full_name: 'System Administrator', role: 'super_admin', office_id: null },
    { email: 'manager.main@zaneco.ph', password_hash: passwordHash, full_name: 'Main Office Manager', role: 'office_manager', office_id: 1 },
    { email: 'staff.main@zaneco.ph', password_hash: passwordHash, full_name: 'Main Office Staff', role: 'staff', office_id: 1 },
  ]

  for (const a of adminAccounts) {
    await prisma.administrator.upsert({
      where: { email: a.email },
      update: {},
      create: {
        email: a.email,
        passwordHash: a.password_hash,
        fullName: a.full_name,
        role: a.role,
        officeId: a.office_id,
      },
    })
  }

  // Generate time slots for next 30 days
  const today = new Date()
  const slotTimes = []
  for (let h = 8; h < 17; h++) {
    slotTimes.push(`${String(h).padStart(2, '0')}:00:00`)
    if (h < 16) slotTimes.push(`${String(h).padStart(2, '0')}:30:00`)
  }

  for (const office of allOffices) {
    for (let d = 0; d < 30; d++) {
      const date = new Date(today)
      date.setDate(date.getDate() + d)
      const dayOfWeek = date.getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) continue

      const dateStr = date.toISOString().split('T')[0]
      for (let t = 0; t < slotTimes.length - 1; t++) {
        const startTime = slotTimes[t]
        const endTime = slotTimes[t + 1]
        await prisma.timeSlot.upsert({
          where: { officeId_slotDate_startTime: { officeId: office.id, slotDate: dateStr, startTime } },
          update: {},
          create: {
            officeId: office.id,
            slotDate: dateStr,
            startTime,
            endTime,
            maxCapacity: office.slotCapacity,
          },
        })
      }
    }
  }

  console.log('Seed data inserted successfully')
  await prisma.$disconnect()
}

runSeed().catch(err => { console.error(err); process.exit(1) })
