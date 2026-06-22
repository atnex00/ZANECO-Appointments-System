// Notification worker — polls for pending notifications and 24h reminders
const { prepare, save } = require('./db/database')

let interval = null

function start(intervalMs = 30000) {
  console.log('Notification worker started (interval: ' + intervalMs + 'ms)')
  interval = setInterval(processQueue, intervalMs)
  // Also run immediately
  processQueue()
  processReminders()
}

function stop() {
  if (interval) { clearInterval(interval); interval = null }
  console.log('Notification worker stopped')
}

function processQueue() {
  try {
    const pending = prepare("SELECT * FROM notifications WHERE status = 'pending' AND retry_count < 3 ORDER BY created_at LIMIT 10").all()
    for (const notif of pending) {
      // Simulate sending via appropriate channel
      const success = simulateSend(notif)
      if (success) {
        prepare("UPDATE notifications SET status = 'sent', sent_at = datetime('now') WHERE id = ?").run(notif.id)
        console.log(`  [SENT] ${notif.channel} ${notif.type} → ${notif.recipient}`)
      } else {
        prepare("UPDATE notifications SET status = 'retrying', retry_count = retry_count + 1 WHERE id = ?").run(notif.id)
        console.log(`  [FAIL] ${notif.channel} ${notif.type} → ${notif.recipient} (retry ${notif.retry_count + 1})`)
      }
    }
    if (pending.length) save()
  } catch (err) {
    console.error('Notification worker error:', err.message)
  }
}

function processReminders() {
  try {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]

    const due = prepare(
      "SELECT a.id, a.reference_number, a.mobile_number, a.email, a.consumer_name, a.appointment_date, a.start_time, o.name AS office_name FROM appointments a JOIN offices o ON a.office_id = o.id WHERE a.appointment_date = ? AND a.status IN ('confirmed', 'rescheduled') AND NOT EXISTS (SELECT 1 FROM notifications n WHERE n.appointment_id = a.id AND n.type = 'reminder' AND n.status = 'sent')"
    ).all(dateStr)

    for (const apt of due) {
      // Create SMS reminder
      const smsMsg = `REMINDER: Your ZANECO appointment is tomorrow.\nRef: ${apt.reference_number}\nDate: ${apt.appointment_date}\nTime: ${apt.start_time?.slice(0,5)}\nOffice: ${apt.office_name}\nPlease arrive 10 minutes early.`
      prepare("INSERT INTO notifications (appointment_id, channel, type, recipient, message, status) VALUES (?, 'sms', 'reminder', ?, ?, 'pending')").run(apt.id, apt.mobile_number, smsMsg)

      // Create email reminder if email exists
      if (apt.email) {
        const emailMsg = `Dear ${apt.consumer_name},\n\nThis is a reminder of your ZANECO appointment tomorrow.\n\nReference: ${apt.reference_number}\nDate: ${apt.appointment_date}\nTime: ${apt.start_time?.slice(0,5)}\nOffice: ${apt.office_name}\n\nPlease arrive 10 minutes early and bring your valid ID.\n\n— ZANECO Appointments`
        prepare("INSERT INTO notifications (appointment_id, channel, type, recipient, message, status) VALUES (?, 'email', 'reminder', ?, ?, 'pending')").run(apt.id, apt.email, emailMsg)
      }
      console.log(`  [REMINDER] Queued for ${apt.reference_number}`)
    }
    if (due.length) save()
  } catch (err) {
    console.error('Reminder processor error:', err.message)
  }
}

function simulateSend(notif) {
  // In production, replace with actual Twilio/SMTP calls
  // For now, simulate 90% success rate
  return Math.random() > 0.1
}

module.exports = { start, stop }
