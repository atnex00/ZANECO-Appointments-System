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

  // Seed office schedules (Mon-Fri working, Sat-Sun off)
  const allOffices = await prisma.office.findMany()
  const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  const weekends = ['saturday', 'sunday']

  for (const office of allOffices) {
    for (const day of weekdays) {
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
    for (const day of weekends) {
      await prisma.officeSchedule.upsert({
        where: { officeId_dayOfWeek: { officeId: office.id, dayOfWeek: day } },
        update: {},
        create: {
          officeId: office.id,
          dayOfWeek: day,
          openingTime: '08:00:00',
          closingTime: '17:00:00',
          isWorkingDay: false,
        },
      })
    }
  }

  // Seed admin accounts
  const mainOffice = await prisma.office.findUnique({ where: { code: 'MAIN' } })
  const passwordHash = bcrypt.hashSync('admin123', 10)
  const adminAccounts = [
    { email: 'admin@zaneco.ph', password_hash: passwordHash, full_name: 'System Administrator', role: 'super_admin', office_id: null },
    { email: 'manager.main@zaneco.ph', password_hash: passwordHash, full_name: 'Main Office Manager', role: 'office_manager', office_id: mainOffice.id },
    { email: 'staff.main@zaneco.ph', password_hash: passwordHash, full_name: 'Main Office Staff', role: 'staff', office_id: mainOffice.id },
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

  // Generate time slots for next 30 days using office schedules
  const today = new Date()
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

  for (const office of allOffices) {
    const schedules = await prisma.officeSchedule.findMany({ where: { officeId: office.id } })
    const scheduleMap = {}
    for (const s of schedules) {
      scheduleMap[s.dayOfWeek] = s
    }

    for (let d = 0; d < 30; d++) {
      const date = new Date(today)
      date.setDate(date.getDate() + d)
      const dayName = dayNames[date.getDay()]
      const schedule = scheduleMap[dayName]
      if (!schedule || !schedule.isWorkingDay) continue

      const dateStr = date.toISOString().split('T')[0]
      const openH = parseInt(schedule.openingTime.slice(0, 2))
      const openM = parseInt(schedule.openingTime.slice(3, 5))
      const closeH = parseInt(schedule.closingTime.slice(0, 2))
      const closeM = parseInt(schedule.closingTime.slice(3, 5))
      const duration = office.appointmentDurationMinutes

      for (let h = openH; h < closeH; h++) {
        for (let m = (h === openH ? openM : 0); m < 60; m += duration) {
          const startTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
          const endMinutes = h * 60 + m + duration
          const eh = Math.floor(endMinutes / 60)
          const em = endMinutes % 60
          if (eh > closeH || (eh === closeH && em > closeM)) continue
          const endTime = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}:00`
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
  }

  console.log('Seed data inserted successfully')
  await prisma.$disconnect()
}

runSeed().catch(err => { console.error(err); process.exit(1) })
