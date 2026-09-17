import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { ExamService } from '../services/ExamService'
import { generateId } from '../utils/helpers'

export function examActivityKey(userId) {
  return `bookmarkhub_exam_activity_${userId || 'guest'}`
}

export function readExamActivity(userId) {
  try {
    const raw = localStorage.getItem(examActivityKey(userId))
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function formatExamActivityTime(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  return `${date} • ${time}`
}

/** Shared exam state so the page body and the global RightPanel stay in sync. */
export const useExamStore = create((set) => ({
  exams: [],
  activity: [],
  examsLoading: true,
  /** Exam currently open in the details modal (settable from page or rail). */
  detailExam: null,
  /** Incremented to ask the page to scroll to the Upcoming slider. */
  examScrollSignal: 0,

  setExams: (exams) => set({ exams }),
  setDetailExam: (exam) => set({ detailExam: exam }),
  bumpExamScroll: () => set((s) => ({ examScrollSignal: s.examScrollSignal + 1 })),

  loadExams: async (userId) => {
    set({ examsLoading: true })
    const data = await ExamService.getAll(userId)
    set({
      exams: Array.isArray(data) ? data : [],
      activity: readExamActivity(userId),
      examsLoading: false,
    })
  },

  logExamActivity: (userId, type, name) => {
    const entry = { id: generateId(), type, name, at: new Date().toISOString() }
    set((s) => {
      const next = [entry, ...s.activity].slice(0, 30)
      try {
        localStorage.setItem(examActivityKey(userId), JSON.stringify(next))
      } catch {
        // ignore storage errors
      }
      return { activity: next }
    })
  },
}))

/** Minute ticker (+ exact midnight rollover) for automatic countdown updates. */
export function useExamNow() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const tick = () => setNow(new Date())
    const id = setInterval(tick, 60 * 1000)
    const midnight = new Date()
    midnight.setHours(24, 0, 5, 0)
    const ms = midnight.getTime() - Date.now()
    const mid = setTimeout(tick, ms)
    return () => { clearInterval(id); clearTimeout(mid) }
  }, [])
  return now
}
