export function required(value) {
  if (value === null || value === undefined || value === '') return 'This field is required'
  return ''
}

export function mobileNumber(value) {
  if (!value) return ''
  const cleaned = value.replace(/\s/g, '')
  if (!/^09\d{9}$/.test(cleaned)) return 'Enter a valid mobile number (09XXXXXXXXX)'
  return ''
}

export function email(value) {
  if (!value) return ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Enter a valid email address'
  return ''
}

export function accountNumber(value) {
  if (!value) return ''
  if (!/^\d{8}$/.test(value)) return 'Enter a valid 8-digit account number'
  return ''
}

export function validate(fields, values) {
  const errors = {}
  for (const [field, rules] of Object.entries(fields)) {
    for (const rule of rules) {
      const error = rule(values[field])
      if (error) {
        errors[field] = error
        break
      }
    }
  }
  return errors
}
