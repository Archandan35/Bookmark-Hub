export function isUrl(string) {
  try {
    new URL(string)
    return true
  } catch {
    return false
  }
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isNotEmpty(value) {
  return value !== undefined && value !== null && value.toString().trim() !== ''
}

export function minLength(min) {
  return (value) => !value || value.length >= min
}

export function maxLength(max) {
  return (value) => !value || value.length <= max
}
