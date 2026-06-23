const prisma = require('./db/database')
const emailService = require('./services/emailService')

let interval = null

function start(intervalMs = 30000) {
  console.log('Notification worker started (interval: ' + intervalMs + 'ms)')
  interval = setInterval(processQueue, intervalMs)
  processQueue()
  processReminders()
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
  return simulateSend(notif)
}

async function processQueue() {
  try {
    const pending = await prisma.notification.findMany({
      where: { status: 'pending', retryCount: { lt: 3 } },
      orderBy: { createdAt: 'asc' },
      take: 10,
    })

    for (const notif of pending) {
      sendNotification(notif).then(async success => {
        if (success) {
          await prisma.notification.update({
            where: { id: notif.id },
            data: { status: 'sent', sentAt: new Date().toISOString() },
          })
          console.log(`  [SENT] ${notif.channel} ${notif.type} → ${notif.recipient}`)
        } else {
          await prisma.notification.update({
            where: { id: notif.id },
            data: { status: 'retrying', retryCount: { increment: 1 } },
          })
          console.log(`  [FAIL] ${notif.channel} ${notif.type} → ${notif.recipient} (retry ${notif.retryCount + 1})`)
        }
      }).catch(err => {
        console.error(`Notification send error: ${err.message}`)
      })
    }
  } catch (err) {
    console.error('Notification worker error:', err.message)
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
        notifications: { none: { type: 'reminder', status: 'sent' } },
      },
      include: { office: { select: { name: true } } },
    })

    for (const apt of due) {
      const smsMsg = `REMINDER: Your ZANECO appointment is tomorrow.\nRef: ${apt.referenceNumber}\nDate: ${apt.appointmentDate}\nTime: ${apt.startTime?.slice(0,5)}\nOffice: ${apt.office.name}\nPlease arrive 10 minutes early.`
      await prisma.notification.create({
        data: {
          appointmentId: apt.id,
          channel: 'sms',
          type: 'reminder',
          recipient: apt.mobileNumber,
          message: smsMsg,
        },
      })

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
    console.error('Reminder processor error:', err.message)
  }
}

function simulateSend(notif) {
  return Math.random() > 0.1
}

module.exports = { start, stop }
