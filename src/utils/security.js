const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /api[_-]?key/i,
  /auth/i,
  /credential/i,
  /private[_-]?key/i,
  /bearer\s+/i,
  /authorization/i,
]

export function sanitizeInput(input) {
  if (!input || typeof input !== 'string') return ''
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .replace(/data:/gi, '')
    .trim()
}

export function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return {}
  const sanitized = {}
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value)
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value)
    } else {
      sanitized[key] = value
    }
  }
  return sanitized
}

export function isSensitiveKey(key) {
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(key))
}

export function maskSensitiveData(data) {
  if (!data || typeof data !== 'object') return data
  const masked = {}
  for (const [key, value] of Object.entries(data)) {
    if (isSensitiveKey(key)) {
      masked[key] = '***REDACTED***'
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskSensitiveData(value)
    } else {
      masked[key] = value
    }
  }
  return masked
}

export function secureLog(level, message, data) {
  if (import.meta.env.PROD) return

  const safeData = data ? maskSensitiveData(data) : undefined
  switch (level) {
    case 'warn':
      console.warn(`[${new Date().toISOString()}] ${message}`, safeData || '')
      break
    case 'error':
      console.error(`[${new Date().toISOString()}] ${message}`, safeData || '')
      break
    default:
      console.log(`[${new Date().toISOString()}] ${message}`, safeData || '')
  }
}

export function validateEmail(email) {
  if (!email || typeof email !== 'string') return false
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim())
}

export function validatePassword(password) {
  if (!password || typeof password !== 'string') return { valid: false, score: 0 }
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score++
  return { valid: score >= 4, score, maxScore: 6 }
}

export function generateCSRFToken() {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('')
}

export function getCSRFToken() {
  let token = sessionStorage.getItem('csrf_token')
  if (!token) {
    token = generateCSRFToken()
    sessionStorage.setItem('csrf_token', token)
  }
  return token
}

export function clearSensitiveStorage() {
  sessionStorage.removeItem('csrf_token')
  const keysToRemove = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && isSensitiveKey(key)) {
      keysToRemove.push(key)
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key))
}

if (import.meta.env.PROD) {
  const originalLog = console.log
  const originalWarn = console.warn
  const originalError = console.error

  console.log = (...args) => {
    if (args.some((a) => typeof a === 'string' && SENSITIVE_PATTERNS.some((p) => p.test(a)))) return
    originalLog(...args)
  }
  console.warn = (...args) => {
    if (args.some((a) => typeof a === 'string' && SENSITIVE_PATTERNS.some((p) => p.test(a)))) return
    originalWarn(...args)
  }
  console.error = (...args) => {
    if (args.some((a) => typeof a === 'string' && SENSITIVE_PATTERNS.some((p) => p.test(a)))) return
    originalError(...args)
  }
}
