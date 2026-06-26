const fs = require('fs')
const nodemailer = require('nodemailer')
const path = require('path')
const config = require('../config')

let transporter = null

function getTransporter() {
  if (transporter) return transporter
  if (!config.email.smtpHost) {
    console.log('SMTP not configured — email sending disabled')
    return null
  }
  if ((config.email.smtpUser && !config.email.smtpPass) || (!config.email.smtpUser && config.email.smtpPass)) {
    console.warn('SMTP: only one of USER/PASS configured — auth will be disabled')
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
    const attachments = []
    if (fs.existsSync(LOGO_PATH)) {
      attachments.push({ path: LOGO_PATH, cid: LOGO_CID, contentDisposition: 'inline' })
    }
    await t.sendMail({
      from: config.email.from,
      to,
      subject,
      html,
      attachments,
    })
    return true
  } catch (err) {
    console.error('Email send failed:', err.message)
    return false
  }
}

const FONTS = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

const LOGO_CID = 'logo@zaneco'
const LOGO_PATH = path.resolve(__dirname, '../../frontend/public/logo-combined.png')

function emailShell(body, options = {}) {
  const { subtitle, statusBadge } = options
  return `
    <div style="font-family: ${FONTS}; background: #fffbeb; padding: 24px 16px;">
      <table style="max-width: 560px; margin: 0 auto; width: 100%;" cellpadding="0" cellspacing="0">
        <tr>
          <td style="background: #d97706; border-radius: 12px 12px 0 0; padding: 28px 32px; text-align: center;">
            <div style="margin-bottom: 8px;"><img src="cid:${LOGO_CID}" alt="ZANECO" width="160" style="display: block; margin: 0 auto;" /></div>
            <p style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 700; letter-spacing: -0.01em;">Appointments System</p>
            <p style="margin: 6px 0 0; color: #fef3c7; font-size: 13px;">${subtitle || 'Consumer Appointment System'}</p>
          </td>
        </tr>
        <tr>
          <td style="background: #ffffff; padding: 32px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            ${statusBadge ? `<div style="text-align: center; margin-bottom: 20px;">${statusBadge}</div>` : ''}
            ${body}
          </td>
        </tr>
        <tr>
          <td style="padding: 16px 32px; text-align: center;">
            <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">ZANECO Appointments System</p>
            <p style="margin: 2px 0 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">This is an automated message. Please do not reply.</p>
          </td>
        </tr>
      </table>
    </div>`
}

function detailRow(label, value) {
  return `
    <tr>
      <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 13px; vertical-align: top; width: 40%;">${label}</td>
      <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; color: #111827; font-size: 14px; font-weight: 600; vertical-align: top;">${value}</td>
    </tr>`
}

async function sendConfirmation(appointment) {
  const html = emailShell(`
    <p style="margin: 0 0 16px; color: #374151; font-size: 15px; line-height: 1.6;">Dear <strong style="color: #111827;">${appointment.consumer_name}</strong>,</p>
    <p style="margin: 0 0 20px; color: #374151; font-size: 15px; line-height: 1.6;">Your appointment has been successfully booked. Please find the details below:</p>
    <table style="width: 100%; border-collapse: collapse;">
      ${detailRow('Reference No.', appointment.reference_number)}
      ${detailRow('Date', appointment.appointment_date)}
      ${detailRow('Time', `${appointment.start_time?.slice(0,5)} - ${appointment.end_time?.slice(0,5)}`)}
      ${detailRow('Office', appointment.office)}
      ${detailRow('Concern', appointment.concern_type)}
    </table>
    <div style="margin-top: 20px; padding: 12px 16px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px;">
      <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.5;"><strong>Tip:</strong> Please arrive 10 minutes early and bring a valid ID.</p>
    </div>
  `, { subtitle: 'Booking Confirmation', statusBadge: '<span style="display: inline-block; padding: 4px 14px; background: #d97706; color: #ffffff; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;">Pending</span>' })
  return sendEmail({
    to: appointment.email,
    subject: `Booking Confirmed — ${appointment.reference_number}`,
    html,
  })
}

async function sendReminder(appointment) {
  const html = emailShell(`
    <p style="margin: 0 0 16px; color: #374151; font-size: 15px; line-height: 1.6;">Dear <strong style="color: #111827;">${appointment.consumer_name}</strong>,</p>
    <p style="margin: 0 0 20px; color: #374151; font-size: 15px; line-height: 1.6;">This is a reminder of your ZANECO appointment scheduled for <strong>tomorrow</strong>.</p>
    <table style="width: 100%; border-collapse: collapse;">
      ${detailRow('Reference No.', appointment.reference_number)}
      ${detailRow('Date', appointment.appointment_date)}
      ${detailRow('Time', appointment.start_time?.slice(0,5))}
      ${detailRow('Office', appointment.office_name)}
    </table>
    <div style="margin-top: 20px; padding: 12px 16px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px;">
      <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.5;"><strong>Reminder:</strong> Please arrive 10 minutes early and bring your valid ID.</p>
    </div>
  `, { subtitle: 'Appointment Reminder' })
  return sendEmail({
    to: appointment.email,
    subject: `Reminder: Appointment Tomorrow — ${appointment.reference_number}`,
    html,
  })
}

async function sendConfirmed(appointment) {
  const html = emailShell(`
    <p style="margin: 0 0 16px; color: #374151; font-size: 15px; line-height: 1.6;">Dear <strong style="color: #111827;">${appointment.consumer_name}</strong>,</p>
    <p style="margin: 0 0 20px; color: #374151; font-size: 15px; line-height: 1.6;">Your appointment has been <strong>confirmed</strong> by ZANECO. Please see the details below:</p>
    <table style="width: 100%; border-collapse: collapse;">
      ${detailRow('Reference No.', appointment.reference_number)}
      ${detailRow('Date', appointment.appointment_date)}
      ${detailRow('Time', `${appointment.start_time?.slice(0,5)} - ${appointment.end_time?.slice(0,5)}`)}
      ${detailRow('Office', appointment.office)}
      ${detailRow('Concern', appointment.concern_type)}
    </table>
    <div style="margin-top: 20px; padding: 12px 16px; background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px;">
      <p style="margin: 0; color: #065f46; font-size: 13px; line-height: 1.5;">Please arrive 10 minutes early and bring a valid ID.</p>
    </div>
  `, { subtitle: 'Appointment Confirmed', statusBadge: '<span style="display: inline-block; padding: 4px 14px; background: #059669; color: #ffffff; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;">Confirmed</span>' })
  return sendEmail({
    to: appointment.email,
    subject: `Appointment Confirmed by ZANECO — ${appointment.reference_number}`,
    html,
  })
}

async function sendRejected(appointment) {
  const reason = appointment.reason ? `
    <tr>
      <td style="padding: 10px 0; color: #6b7280; font-size: 13px; vertical-align: top; width: 40%;">Reason</td>
      <td style="padding: 10px 0; color: #111827; font-size: 14px; font-weight: 600; vertical-align: top;">${appointment.reason}</td>
    </tr>` : ''
  const html = emailShell(`
    <p style="margin: 0 0 16px; color: #374151; font-size: 15px; line-height: 1.6;">Dear <strong style="color: #111827;">${appointment.consumer_name}</strong>,</p>
    <p style="margin: 0 0 20px; color: #374151; font-size: 15px; line-height: 1.6;">We regret to inform you that your appointment request could not be approved at this time.</p>
    <table style="width: 100%; border-collapse: collapse;">
      ${detailRow('Reference No.', appointment.reference_number)}
      ${detailRow('Date', appointment.appointment_date)}
      ${detailRow('Time', `${appointment.start_time?.slice(0,5)} - ${appointment.end_time?.slice(0,5)}`)}
      ${detailRow('Office', appointment.office)}
      ${reason}
    </table>
    <div style="margin-top: 20px; padding: 12px 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px;">
      <p style="margin: 0; color: #991b1b; font-size: 13px; line-height: 1.5;">If you have questions, please contact ZANECO customer support.</p>
    </div>
  `, { subtitle: 'Appointment Update', statusBadge: '<span style="display: inline-block; padding: 4px 14px; background: #dc2626; color: #ffffff; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em;">Not Approved</span>' })
  return sendEmail({
    to: appointment.email,
    subject: `Appointment Not Approved — ${appointment.reference_number}`,
    html,
  })
}

module.exports = { sendConfirmation, sendReminder, sendConfirmed, sendRejected, sendEmail, emailShell }
