const prisma = require('./db/database')
const emailService = require('./services/emailService')
const smsService = require('./services/smsService')

let interval = null
let tickCount = 0

function start(intervalMs = 30000) {
  console.log('Notification worker started (interval: ' + intervalMs + 'ms)')
  interval = setInterval(tick, intervalMs)
  tick()
}

async function tick() {
  tickCount++
  await processQueue()
  await processReminders()
  if (tickCount % 60 === 0) await cleanupOldBookingRequests()
}

function stop() {
  if (interval) { clearInterval(interval); interval = null }
  console.log('Notification worker stopped')
}

async function sendNotification(notif) {
  if (notif.channel === 'email') {
    return emailService.sendEmail({
      to: notif.recipient,
      subject: `ZANECO Appointment — ${notif.type}`,
      html: notif.message.replace(/\n/g, '<br>'),
    })
  }
  if (notif.channel === 'sms') {
    return smsService.sendSMS({ to: notif.recipient, message: notif.message })
  }
  return false
}

async function processQueue() {
  try {
    const pending = await prisma.notification.findMany({
      where: { status: { in: ['pending', 'retrying'] }, retryCount: { lt: 3 } },
      orderBy: { createdAt: 'asc' },
      take: 10,
    })

    for (const notif of pending) {
      try {
        const success = await sendNotification(notif)
        if (success) {
          await prisma.notification.update({
            where: { id: notif.id },
            data: { status: 'sent', sentAt: new Date().toISOString() },
          })
          console.log(`  [SENT] ${notif.channel} ${notif.type} → ${notif.recipient}`)
        } else {
          const newRetryCount = notif.retryCount + 1
          const newStatus = newRetryCount >= 3 ? 'failed' : 'retrying'
          await prisma.notification.update({
            where: { id: notif.id },
            data: { status: newStatus, retryCount: { increment: 1 } },
          })
          console.log(`  [FAIL] ${notif.channel} ${notif.type} → ${notif.recipient} (retry ${newRetryCount})`)
        }
      } catch (err) {
        console.error(`Notification send error:`, err)
      }
    }
  } catch (err) {
    console.error('Notification worker error:', err)
  }
}

async function processReminders() {
  try {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]

    const due = await prisma.appointment.findMany({
      where: {
        appointmentDate: dateStr,
        status: { in: ['confirmed', 'rescheduled'] },
        notifications: { none: { type: 'reminder', status: { in: ['sent', 'pending'] } } },
      },
      include: { office: { select: { name: true } } },
    })

    for (const apt of due) {
      if (apt.email) {
        const emailMsg = `Dear ${apt.consumerName},\n\nThis is a reminder of your ZANECO appointment tomorrow.\n\nReference: ${apt.referenceNumber}\nDate: ${apt.appointmentDate}\nTime: ${apt.startTime?.slice(0,5)}\nOffice: ${apt.office.name}\n\nPlease arrive 10 minutes early and bring your valid ID.\n\n— ZANECO Appointments`
        await prisma.notification.create({
          data: {
            appointmentId: apt.id,
            channel: 'email',
            type: 'reminder',
            recipient: apt.email,
            message: emailMsg,
          },
        })
      }
      console.log(`  [REMINDER] Queued for ${apt.referenceNumber}`)
    }
  } catch (err) {
    console.error('Reminder processor error:', err)
  }
}

async function cleanupOldBookingRequests() {
  try {
    const cutoff = new Date(Date.now() - 24 * 3600000).toISOString()
    const { count } = await prisma.bookingRequest.deleteMany({
      where: { createdAt: { lt: cutoff } },
    })
    if (count > 0) console.log(`[CLEANUP] Deleted ${count} old booking request records`)
  } catch (err) {
    console.error('Booking cleanup error:', err)
  }
}

module.exports = { start, stop }
