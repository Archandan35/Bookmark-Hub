import { ExamRepository } from '../repositories/ExamRepository'
import { generateId, localDateStr, parseLocalDate } from '../utils/helpers'

export const REMINDER_OPTIONS = [
  { value: '30d', label: '30 days before' },
  { value: '15d', label: '15 days before' },
  { value: '7d', label: '7 days before' },
  { value: '3d', label: '3 days before' },
  { value: '1d', label: '1 day before' },
  { value: '0d', label: 'On exam day' },
]

export const EXAM_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'completed', label: 'Completed' },
  { value: 'passed', label: 'Passed' },
]

export const EXAM_SORTS = [
  { value: 'nearest', label: 'Nearest Exam' },
  { value: 'name', label: 'Alphabetical' },
  { value: 'recently_added', label: 'Recently Added' },
  { value: 'recently_updated', label: 'Recently Updated' },
]

function startOfDay(d) {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

function examDateTime(exam) {
  if (!exam?.exam_date) return null
  const base = parseLocalDate(exam.exam_date) || new Date(exam.exam_date)
  if (!base || Number.isNaN(base.getTime())) return null
  if (exam.exam_time) {
    const m = String(exam.exam_time).match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i)
    if (m) {
      let h = parseInt(m[1], 10)
      const min = parseInt(m[2], 10)
      const ap = (m[3] || '').toUpperCase()
      if (ap === 'PM' && h < 12) h += 12
      if (ap === 'AM' && h === 12) h = 0
      base.setHours(h, min, 0, 0)
    }
  } else {
    base.setHours(0, 0, 0, 0)
  }
  return base
}

/** Whole calendar days from today until the exam date (negative = past). */
export function daysLeft(exam, now = new Date()) {
  const dt = examDateTime(exam)
  if (!dt) return null
  const a = startOfDay(now).getTime()
  const b = startOfDay(dt).getTime()
  return Math.round((b - a) / 86400000)
}

export function countdownLabel(exam, now = new Date()) {
  if (exam?.completed) return 'EXAM COMPLETED'
  const d = daysLeft(exam, now)
  if (d === null) return 'NO DATE'
  if (d < 0) return 'EXAM DATE PASSED'
  if (d === 0) return 'TODAY'
  if (d === 1) return '1 DAY LEFT'
  return `${d} DAYS LEFT`
}

/**
 * Status is derived automatically — the stored exam_date is the single source of truth.
 * completed (manual) > passed (date in past) > today > tomorrow > upcoming
 */
export function deriveStatus(exam, now = new Date()) {
  if (exam?.completed) return 'completed'
  const d = daysLeft(exam, now)
  if (d === null) return 'upcoming'
  if (d < 0) return 'passed'
  if (d === 0) return 'today'
  if (d === 1) return 'tomorrow'
  return 'upcoming'
}

export const STATUS_META = {
  upcoming: { label: 'Upcoming', className: 'exam-status-upcoming' },
  tomorrow: { label: 'Tomorrow', className: 'exam-status-tomorrow' },
  today: { label: 'Today', className: 'exam-status-today' },
  completed: { label: 'Completed', className: 'exam-status-completed' },
  passed: { label: 'Passed', className: 'exam-status-passed' },
}

export function filterExams(exams, { query = '', filter = 'all' } = {}, now = new Date()) {
  const q = query.trim().toLowerCase()
  let list = exams.map((e) => ({ ...e, _status: deriveStatus(e, now), _days: daysLeft(e, now) }))

  if (q) {
    list = list.filter((e) =>
      [e.exam_name, e.recruiter, e.category].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
    )
  }

  switch (filter) {
    case 'upcoming':
      list = list.filter((e) => ['upcoming', 'tomorrow', 'today'].includes(e._status))
      break
    case 'today':
      list = list.filter((e) => e._status === 'today')
      break
    case 'tomorrow':
      list = list.filter((e) => e._status === 'tomorrow')
      break
    case 'completed':
      list = list.filter((e) => e._status === 'completed')
      break
    case 'passed':
      list = list.filter((e) => e._status === 'passed')
      break
    default:
      break
  }
  return list
}

export function sortExams(exams, sort = 'nearest') {
  const list = [...exams]
  switch (sort) {
    case 'latest':
      list.sort((a, b) => String(b.exam_date).localeCompare(String(a.exam_date)))
      break
    case 'name':
      list.sort((a, b) => String(a.exam_name || '').localeCompare(String(b.exam_name || '')))
      break
    case 'recently_added':
      list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      break
    case 'recently_updated':
      list.sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0))
      break
    case 'nearest':
    default:
      // nearest upcoming first; completed/passed sink to the end
      list.sort((a, b) => {
        const da = a._days ?? daysLeft(a) ?? Number.MAX_SAFE_INTEGER
        const db = b._days ?? daysLeft(b) ?? Number.MAX_SAFE_INTEGER
        const aDone = a._status === 'completed' || a._status === 'passed' ? 1 : 0
        const bDone = b._status === 'completed' || b._status === 'passed' ? 1 : 0
        if (aDone !== bDone) return aDone - bDone
        return da - db
      })
      break
  }
  return list
}

export function computeExamStats(exams, now = new Date()) {
  const monthKey = `${now.getFullYear()}-${now.getMonth()}`
  let upcoming = 0
  let completed = 0
  let thisMonth = 0
  exams.forEach((e) => {
    const s = deriveStatus(e, now)
    if (['upcoming', 'tomorrow', 'today'].includes(s)) upcoming += 1
    if (s === 'completed' || s === 'passed') completed += 1
    if (e.exam_date) {
      const d = parseLocalDate(e.exam_date) || new Date(e.exam_date)
      if (!Number.isNaN(d?.getTime()) && `${d.getFullYear()}-${d.getMonth()}` === monthKey) thisMonth += 1
    }
  })
  return {
    total: exams.length,
    upcoming,
    completed,
    thisMonth,
    thisYear: exams.filter((e) => e.exam_date && String(e.exam_date).startsWith(String(now.getFullYear()))).length,
  }
}

export function findDuplicate(exams, { exam_name, exam_date }, ignoreId = null) {
  const name = String(exam_name || '').trim().toLowerCase()
  if (!name || !exam_date) return null
  return (
    exams.find(
      (e) =>
        e.id !== ignoreId &&
        String(e.exam_name || '').trim().toLowerCase() === name &&
        String(e.exam_date) === String(exam_date)
    ) || null
  )
}

export function formatExamDate(dateStr) {
  if (!dateStr) return '—'
  const d = parseLocalDate(dateStr) || new Date(dateStr)
  if (!d || Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function formatExamTime(timeStr) {
  if (!timeStr) return '—'
  const m = String(timeStr).match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i)
  if (!m) return timeStr
  let h = parseInt(m[1], 10)
  const min = m[2]
  if (m[3]) return `${h}:${min} ${m[3].toUpperCase()}`
  const ap = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${min} ${ap}`
}

export const ExamService = {
  async getAll(userId) {
    try {
      const rows = await ExamRepository.getAll(userId)
      // Forward-compat: rows cached locally before the subject->recruiter rename.
      return (Array.isArray(rows) ? rows : []).map((e) => ({
        ...e,
        recruiter: e.recruiter ?? e.subject ?? '',
      }))
    } catch {
      return []
    }
  },

  async create(userId, data) {
    const record = {
      id: generateId(),
      user_id: userId,
      exam_name: data.exam_name?.trim(),
      exam_date: data.exam_date,
      exam_time: data.exam_time || '',
      category: data.category || '',
      recruiter: data.recruiter ?? data.subject ?? '',
      description: data.description || '',
      exam_link: data.exam_link || '',
      notes: data.notes || '',
      reminder_settings: data.reminder_settings || [],
      reminders_enabled: data.reminders_enabled ?? true,
      completed: false,
      completed_at: null,
    }
    return ExamRepository.create(record)
  },

  async update(id, userId, data) {
    return ExamRepository.update(id, userId, data)
  },

  async remove(id, userId) {
    return ExamRepository.remove(id, userId)
  },

  async toggleComplete(exam, userId, completed) {
    return ExamRepository.update(exam.id, userId, {
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
  },

  async restore(exam, userId) {
    return this.toggleComplete(exam, userId, false)
  },

  todayStr: () => localDateStr(new Date()),
}

export default ExamService
