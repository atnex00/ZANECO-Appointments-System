const nodemailer = require('nodemailer')
const config = require('../config')

let transporter = null

function getTransporter() {
  if (transporter) return transporter
  if (!config.email.smtpHost) {
    console.log('SMTP not configured — email sending disabled')
    return null
  }
  transporter = nodemailer.createTransport({
    host: config.email.smtpHost,
    port: config.email.smtpPort,
    secure: config.email.smtpSecure,
    auth: config.email.smtpUser && config.email.smtpPass ? {
      user: config.email.smtpUser,
      pass: config.email.smtpPass,
    } : undefined,
  })
  return transporter
}

async function sendEmail({ to, subject, html }) {
  const t = getTransporter()
  if (!t) return false
  try {
    await t.sendMail({
      from: config.email.from,
      to,
      subject,
      html,
    })
    return true
  } catch (err) {
    console.error('Email send failed:', err.message)
    return false
  }
}

async function sendConfirmation(appointment) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a5276; color: white; padding: 20px; text-align: center;">
        <h2 style="margin: 0;">ZANECO Appointments</h2>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd;">
        <p>Dear <strong>${appointment.consumer_name}</strong>,</p>
        <p>Your appointment has been successfully booked. Please find the details below:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; color: #666;">Reference No.</td><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">${appointment.reference_number}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; color: #666;">Date</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${appointment.appointment_date}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; color: #666;">Time</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${appointment.start_time?.slice(0,5)} - ${appointment.end_time?.slice(0,5)}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; color: #666;">Office</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${appointment.office}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; color: #666;">Concern</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${appointment.concern_type}</td></tr>
          <tr><td style="padding: 8px; color: #666;">Status</td><td style="padding: 8px; font-weight: bold; color: #e67e22;">${appointment.status}</td></tr>
        </table>
        <p style="color: #888; font-size: 12px;">Please arrive 10 minutes early and bring a valid ID.</p>
        <p style="color: #888; font-size: 12px;">— ZANECO Appointments System</p>
      </div>
    </div>`

  return sendEmail({
    to: appointment.email,
    subject: `Appointment Confirmed — ${appointment.reference_number}`,
    html,
  })
}

async function sendReminder(appointment) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a5276; color: white; padding: 20px; text-align: center;">
        <h2 style="margin: 0;">Appointment Reminder</h2>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd;">
        <p>Dear <strong>${appointment.consumer_name}</strong>,</p>
        <p>This is a reminder of your ZANECO appointment scheduled for <strong>tomorrow</strong>.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; color: #666;">Reference No.</td><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">${appointment.reference_number}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; color: #666;">Date</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${appointment.appointment_date}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; color: #666;">Time</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${appointment.start_time?.slice(0,5)}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; color: #666;">Office</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${appointment.office_name}</td></tr>
        </table>
        <p style="color: #888; font-size: 12px;">Please arrive 10 minutes early and bring your valid ID.</p>
        <p style="color: #888; font-size: 12px;">— ZANECO Appointments System</p>
      </div>
    </div>`

  return sendEmail({
    to: appointment.email,
    subject: `Reminder: Appointment Tomorrow — ${appointment.reference_number}`,
    html,
  })
}

async function sendConfirmed(appointment) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1a5276; color: white; padding: 20px; text-align: center;">
        <h2 style="margin: 0;">Appointment Confirmed</h2>
      </div>
      <div style="padding: 20px; border: 1px solid #ddd;">
        <p>Dear <strong>${appointment.consumer_name}</strong>,</p>
        <p>Your appointment has been <strong>confirmed</strong> by ZANECO. Please see the details below:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; color: #666;">Reference No.</td><td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">${appointment.reference_number}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; color: #666;">Date</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${appointment.appointment_date}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; color: #666;">Time</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${appointment.start_time?.slice(0,5)} - ${appointment.end_time?.slice(0,5)}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; color: #666;">Office</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${appointment.office}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #ddd; color: #666;">Concern</td><td style="padding: 8px; border-bottom: 1px solid #ddd;">${appointment.concern_type}</td></tr>
          <tr><td style="padding: 8px; color: #666;">Status</td><td style="padding: 8px; font-weight: bold; color: #27ae60;">Confirmed</td></tr>
        </table>
        <p style="color: #888; font-size: 12px;">Please arrive 10 minutes early and bring a valid ID.</p>
        <p style="color: #888; font-size: 12px;">— ZANECO Appointments System</p>
      </div>
    </div>`

  return sendEmail({
    to: appointment.email,
    subject: `Appointment Confirmed by ZANECO — ${appointment.reference_number}`,
    html,
  })
}

module.exports = { sendConfirmation, sendReminder, sendConfirmed, sendEmail }
