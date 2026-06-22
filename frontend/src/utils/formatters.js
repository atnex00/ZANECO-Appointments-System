import { format, parseISO } from 'date-fns'

export function formatDate(dateStr) {
  if (!dateStr) return ''
  return format(parseISO(dateStr), 'MMMM d, yyyy')
}

export function formatTime(timeStr) {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 || 12
  return `${hour12}:${m} ${ampm}`
}

export function formatTimeSlot(start, end) {
  return `${formatTime(start)} - ${formatTime(end)}`
}

export function formatMobile(mobile) {
  if (!mobile) return ''
  return mobile.replace(/(\d{4})(\d{3})(\d{4})/, '$1***$3')
}

export function statusLabel(status) {
  const labels = {
    pending: 'Pending',
    confirmed: 'Confirmed',
    rescheduled: 'Rescheduled',
    cancelled: 'Cancelled',
    completed: 'Completed',
    no_show: 'No Show',
    archived: 'Archived',
  }
  return labels[status] || status
}
