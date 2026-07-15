const config = require('../config')

let client = null

function getClient() {
  if (client) return client
  if (!config.sms.twilioSid || !config.sms.twilioToken) {
    console.log('SMS: Twilio not configured — SMS sending disabled')
    return null
  }
  try {
    const twilio = require('twilio')
    client = twilio(config.sms.twilioSid, config.sms.twilioToken)
    console.log('SMS: Twilio client initialized')
    return client
  } catch (err) {
    console.error('SMS: Failed to initialize Twilio client:', err.message)
    return null
  }
}

async function sendSMS({ to, message }) {
  const twilioClient = getClient()
  if (!twilioClient) {
    console.log('SMS: Skipping send (not configured) — to:', to)
    return false
  }
  if (!config.sms.fromNumber) {
    console.error('SMS: TWILIO_FROM_NUMBER not set — cannot send')
    return false
  }

  try {
    const result = await twilioClient.messages.create({
      body: message,
      from: config.sms.fromNumber,
      to,
    })
    console.log(`SMS: Sent to ${to}, SID: ${result.sid}`)
    return true
  } catch (err) {
    console.error(`SMS: Failed to send to ${to}:`, err.message)
    return false
  }
}

module.exports = { sendSMS, getClient }
