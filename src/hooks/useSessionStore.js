import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { localDateStr } from '../utils/helpers'

const DEFAULT_MIN_SESSION_SECONDS = 5
const TICK_MS = 250

export const VIDEO_STATE = {
  NO_VIDEO: 'no-video',
  READY: 'ready',
  PLAYING: 'playing',
  PAUSED: 'paused',
  STOPPED: 'stopped',
}

export const SESSION_PHASE = {
  IDLE: 'idle',
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  DISCARDED: 'discarded',
}

export const CONTENT_TYPES = ['video', 'audio', 'pdf', 'website', 'ebook', 'notes', 'practice', 'other']

function pad(value) {
  return value.toString().padStart(2, '0')
}

export function formatHMS(totalSeconds) {
  const safe = Math.max(0, Math.floor(totalSeconds || 0))
  const h = Math.floor(safe / 3600)
  const m = Math.floor((safe % 3600) / 60)
  const s = safe % 60
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}

export function formatDurationLong(totalSeconds) {
  const safe = Math.max(0, Math.floor(totalSeconds || 0))
  const h = Math.floor(safe / 3600)
  const m = Math.floor((safe % 3600) / 60)
  const s = safe % 60
  const parts = []
  if (h > 0) parts.push(`${h}h`)
  if (m > 0 || h > 0) parts.push(`${m}m`)
  parts.push(`${s}s`)
  return parts.join(' ')
}

export function focusScoreFor(durationSeconds) {
  const d = durationSeconds || 0
  if (d > 3600) return 92
  if (d > 1800) return 88
  if (d > 600) return 82
  if (d > 0) return 78
  return 0
}

export function sessionSeconds(session) {
  if (!session) return 0
  return Math.max(
    0,
    Math.floor(
      Number(session.elapsedSeconds ?? session.elapsed_seconds ?? session.total_duration ?? 0) || 0
    )
  )
}

function newId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `s-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const str = (v, fallback = '') => (v == null ? fallback : String(v))

export function normalizeSession(raw) {
  if (!raw) return null
  const startTime = raw.startTime || raw.started_at || raw.created_at || new Date().toISOString()
  const endTime = raw.endTime || raw.ended_at || null
  const elapsedSeconds = Math.max(
    0,
    Math.floor(Number(raw.elapsedSeconds ?? raw.elapsed_seconds ?? raw.total_duration ?? 0) || 0)
  )
  const completionPercent = Math.max(
    0,
    Math.min(100, Math.round((Number(raw.completionPercent ?? raw.completion_percent ?? 0) || 0) * 10) / 10)
  )
  const videoTitle = raw.videoTitle || raw.bookmark_title || 'Study Session'
  const folderName = raw.folderName || raw.folder_name || ''
  const videoId = raw.videoId ?? raw.bookmark_id ?? null
  const rawStatus = raw.status || 'completed'
  const status = rawStatus === 'active' || rawStatus === 'running' || rawStatus === 'paused' ? 'active' : rawStatus
  const started = new Date(startTime)

  return {
    id: raw.id || newId(),
    sessionNumber: raw.sessionNumber ?? raw.session_number ?? null,
    videoId,
    videoTitle,
    videoName: raw.videoName || raw.video_name || videoTitle,
    folderName,
    startTime,
    endTime,
    elapsedSeconds,
    durationFormatted: formatHMS(elapsedSeconds),
    completionPercent,
    duration: Math.max(0, Math.floor(Number(raw.duration ?? raw.video_duration ?? 0) || 0)),
    status,
    date: Number.isNaN(started.getTime()) ? '' : localDateStr(started),
    time: Number.isNaN(started.getTime())
      ? ''
      : started.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),

    sourceId: raw.sourceId ?? raw.source_id ?? null,
    sourceName: str(raw.sourceName ?? raw.source_name),
    sourceUrl: str(raw.sourceUrl ?? raw.source_url),
    domain: str(raw.domain),
    courseId: raw.courseId ?? raw.course_id ?? null,
    courseName: str(raw.courseName ?? raw.course_name),
    educatorId: raw.educatorId ?? raw.educator_id ?? null,
    educatorName: str(raw.educatorName ?? raw.educator_name),
    lessonId: raw.lessonId ?? raw.lesson_id ?? null,
    lessonNumber: raw.lessonNumber ?? raw.lesson_number ?? null,
    lessonTitle: str(raw.lessonTitle ?? raw.lesson_title),
    topicId: raw.topicId ?? raw.topic_id ?? null,
    topicName: str(raw.topicName ?? raw.topic_name),
    subtopicId: raw.subtopicId ?? raw.subtopic_id ?? null,
    subtopicName: str(raw.subtopicName ?? raw.subtopic_name),
    contentType: str(raw.contentType ?? raw.content_type, 'video'),
    progressStart: Math.max(0, Math.min(100, Math.round(Number(raw.progressStart ?? raw.progress_start ?? 0) || 0))),
    progressEnd: Math.max(0, Math.min(100, Math.round(Number(raw.progressEnd ?? raw.progress_end ?? 0) || 0))),
    continuationOf: raw.continuationOf ?? raw.continuation_of ?? null,

    bookmark_id: videoId,
    bookmark_title: videoTitle,
    folder_name: folderName,
    started_at: startTime,
    ended_at: endTime,
    elapsed_seconds: elapsedSeconds,
    total_duration: elapsedSeconds,
    completion_percent: completionPercent,
  }
}

function sortSessions(list) {
  return [...list].sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
}

function mergeSessions(existing, incoming) {
  const map = new Map()
  existing.forEach((s) => map.set(s.id, s))
  incoming.forEach((s) => {
    const prev = map.get(s.id)
    map.set(s.id, prev ? { ...prev, ...s } : s)
  })
  return sortSessions(Array.from(map.values()))
}

function activeElapsedSeconds(session, atMs) {
  if (!session) return 0
  const running = session.runningSince ? Math.max(0, atMs - session.runningSince) : 0
  return Math.floor((session.accumulatedMs + running) / 1000)
}

/** Total displayed/recorded elapsed including the base from a continued session. */
export function sessionTotalSeconds(session, atMs) {
  if (!session) return 0
  const base = Math.max(0, Math.floor(Number(session.baseElapsedSeconds) || 0))
  return base + activeElapsedSeconds(session, atMs || Date.now())
}

let tickerId = null

export const useSessionStore = create(
  persist(
    (set, get) => {
      function stopTicker() {
        if (tickerId !== null) {
          clearInterval(tickerId)
          tickerId = null
        }
      }

      function startTicker() {
        if (tickerId !== null) return
        tickerId = setInterval(() => {
          const state = get()
          if (!state.activeSession || state.activeSession.runningSince == null) {
            stopTicker()
            return
          }
          set({ now: Date.now() })
        }, TICK_MS)
      }

      return {
        sessions: [],
        activeSession: null,
        sessionPhase: SESSION_PHASE.IDLE,
        videoState: VIDEO_STATE.NO_VIDEO,
        totalStudySeconds: 0,
        minSessionSeconds: DEFAULT_MIN_SESSION_SECONDS,
        pausePreference: null,
        rememberPauseChoice: false,
        pausePromptOpen: false,
        lastVideo: null,
        lastCompletedSession: null,
        now: Date.now(),

        _startTicker: startTicker,
        _stopTicker: stopTicker,

        setMinSessionSeconds: (seconds) => set({ minSessionSeconds: Math.max(0, Number(seconds) || 0) }),

        setVideoState: (videoState) => set({ videoState }),

        setSessions: (incoming) => {
          const normalized = (incoming || []).map(normalizeSession).filter((s) => s && s.status === 'completed')
          set({ sessions: mergeSessions(get().sessions, normalized) })
        },

        addSessions: (incoming) => {
          const normalized = (incoming || []).map(normalizeSession).filter(Boolean)
          set({ sessions: mergeSessions(get().sessions, normalized) })
        },

        nextSessionNumber: (videoKey) => {
          const key = videoKey || ''
          const count = get().sessions.filter(
            (s) => (s.videoId || s.videoTitle || '') === key
          ).length
          return count + 1
        },

        /**
         * Legacy video-triggered start (kept for the local video player flow).
         * Creates a session immediately with the given video info.
         */
        startSession: (videoInfo) => {
          const current = get().activeSession
          if (current) return current

          const videoKey = videoInfo?.id || videoInfo?.title || ''
          const startedAt = Date.now()
          const session = {
            id: newId(),
            sessionNumber: get().nextSessionNumber(videoKey),
            videoId: videoInfo?.id || null,
            videoTitle: videoInfo?.title || 'Unknown Video',
            videoName: videoInfo?.name || videoInfo?.title || 'Unknown Video',
            folderName: videoInfo?.folder || '',
            startTime: new Date(startedAt).toISOString(),
            startedAt,
            accumulatedMs: 0,
            runningSince: startedAt,
            completionPercent: 0,
            duration: videoInfo?.duration || 0,
            status: 'active',
            phase: SESSION_PHASE.ACTIVE,
            isCompleted: false,
            baseElapsedSeconds: 0,
            continuationOf: null,
            progressStart: 0,
            progressEnd: 0,
          }
          set({
            activeSession: session,
            sessionPhase: SESSION_PHASE.ACTIVE,
            now: startedAt,
            lastVideo: { id: session.videoId, title: session.videoTitle, folder: session.folderName },
          })
          startTicker()
          return session
        },

        /**
         * Start a study session with full dimensional metadata.
         * meta: { sourceId, sourceName, sourceUrl, domain, courseId, courseName,
         *         educatorId, educatorName, lessonId, lessonNumber, lessonTitle,
         *         topicId, topicName, subtopicId, subtopicName, contentType, progressStart,
         *         continuationOf, baseElapsedSeconds, videoInfo }
         */
        startStudySession: (meta = {}) => {
          const current = get().activeSession
          if (current) return current

          const videoInfo = meta.videoInfo || {}
          const startedAt = Date.now()
          const videoKey = videoInfo.id || videoInfo.title || ''
          const session = {
            id: newId(),
            sessionNumber: get().nextSessionNumber(videoKey),
            videoId: videoInfo?.id || null,
            videoTitle: meta.sourceName ? `${meta.sourceName} · ${meta.lessonTitle || meta.courseName || 'Study'}` : (videoInfo?.title || 'Study Session'),
            videoName: videoInfo?.name || meta.lessonTitle || meta.courseName || videoInfo?.title || 'Study Session',
            folderName: videoInfo?.folder || '',
            sourceId: meta.sourceId || null,
            sourceName: meta.sourceName || '',
            sourceUrl: meta.sourceUrl || '',
            domain: meta.domain || '',
            courseId: meta.courseId || null,
            courseName: meta.courseName || '',
            educatorId: meta.educatorId || null,
            educatorName: meta.educatorName || '',
            lessonId: meta.lessonId || null,
            lessonNumber: meta.lessonNumber || null,
            lessonTitle: meta.lessonTitle || '',
            topicId: meta.topicId || null,
            topicName: meta.topicName || '',
            subtopicId: meta.subtopicId || null,
            subtopicName: meta.subtopicName || '',
            contentType: meta.contentType || 'video',
            progressStart: Math.max(0, Math.min(100, Math.round(Number(meta.progressStart) || 0))),
            progressEnd: Math.max(0, Math.min(100, Math.round(Number(meta.progressEnd) || 0))),
            continuationOf: meta.continuationOf || null,
            baseElapsedSeconds: Math.max(0, Math.floor(Number(meta.baseElapsedSeconds) || 0)),
            startTime: new Date(startedAt).toISOString(),
            startedAt,
            accumulatedMs: 0,
            runningSince: startedAt,
            completionPercent: Math.max(0, Math.min(100, Math.round(Number(meta.progressStart) || 0))),
            duration: videoInfo?.duration || 0,
            status: 'active',
            phase: SESSION_PHASE.ACTIVE,
            isCompleted: false,
          }
          set({
            activeSession: session,
            sessionPhase: SESSION_PHASE.ACTIVE,
            now: startedAt,
            lastVideo: { id: session.videoId, title: session.videoTitle, folder: session.folderName },
          })
          startTicker()
          return session
        },

        setActiveSessionMeta: (updates) => {
          const { activeSession } = get()
          if (!activeSession) return
          const next = { ...activeSession }
          Object.entries(updates).forEach(([key, value]) => {
            if (value !== undefined) next[key] = value
          })
          set({ activeSession: next, now: Date.now() })
        },

        /**
         * Adopt a remote/persisted active session into this browser (multi-device
         * recovery). The session is installed paused with its recorded time.
         */
        adoptActiveSession: (session) => {
          const current = get().activeSession
          if (current) return current
          const next = {
            id: session.id || newId(),
            sessionNumber: session.sessionNumber || 1,
            videoId: session.videoId || null,
            videoTitle: session.videoTitle || 'Study Session',
            videoName: session.videoName || session.videoTitle || 'Study Session',
            folderName: session.folderName || '',
            sourceId: session.sourceId || null,
            sourceName: session.sourceName || '',
            sourceUrl: session.sourceUrl || '',
            domain: session.domain || '',
            courseId: session.courseId || null,
            courseName: session.courseName || '',
            educatorId: session.educatorId || null,
            educatorName: session.educatorName || '',
            lessonId: session.lessonId || null,
            lessonNumber: session.lessonNumber || null,
            lessonTitle: session.lessonTitle || '',
            topicId: session.topicId || null,
            topicName: session.topicName || '',
            subtopicId: session.subtopicId || null,
            subtopicName: session.subtopicName || '',
            contentType: session.contentType || 'video',
            progressStart: session.progressStart || 0,
            progressEnd: session.progressEnd || 0,
            continuationOf: session.continuationOf || null,
            baseElapsedSeconds: Math.max(0, Math.floor(Number(session.baseElapsedSeconds) || 0)),
            startTime: session.startTime || new Date(Date.now()).toISOString(),
            startedAt: session.startedAt || Date.now(),
            accumulatedMs: Math.max(0, Math.floor(Number(session.accumulatedMs) || 0)),
            runningSince: null,
            completionPercent: session.completionPercent || session.progressEnd || 0,
            duration: session.duration || 0,
            status: 'paused',
            phase: SESSION_PHASE.PAUSED,
            isCompleted: false,
            adopted: true,
            dbActiveRow: session.dbActiveRow || null,
          }
          set({
            activeSession: next,
            sessionPhase: SESSION_PHASE.PAUSED,
            now: Date.now(),
            lastVideo: { id: next.videoId, title: next.videoTitle, folder: next.folderName },
          })
          return next
        },

        pauseTimer: () => {
          const { activeSession } = get()
          if (!activeSession || activeSession.runningSince == null) return
          const at = Date.now()
          set({
            activeSession: {
              ...activeSession,
              accumulatedMs: activeSession.accumulatedMs + (at - activeSession.runningSince),
              runningSince: null,
              status: 'paused',
              phase: SESSION_PHASE.PAUSED,
            },
            sessionPhase: SESSION_PHASE.PAUSED,
            now: at,
          })
          stopTicker()
        },

        resumeTimer: () => {
          const { activeSession } = get()
          if (!activeSession || activeSession.runningSince != null) return
          const at = Date.now()
          set({
            activeSession: { ...activeSession, runningSince: at, status: 'active', phase: SESSION_PHASE.ACTIVE },
            sessionPhase: SESSION_PHASE.ACTIVE,
            now: at,
          })
          startTicker()
        },

        updateProgress: ({ completionPercent, duration, progressEnd } = {}) => {
          const { activeSession } = get()
          if (!activeSession) return
          const nextCompletion =
            completionPercent == null
              ? activeSession.completionPercent
              : Math.max(0, Math.min(100, Math.round(completionPercent * 10) / 10))
          const nextDuration = duration == null ? activeSession.duration : Math.floor(duration)
          const nextProgressEnd =
            progressEnd == null
              ? activeSession.progressEnd
              : Math.max(0, Math.min(100, Math.round(progressEnd)))
          if (
            nextCompletion === activeSession.completionPercent &&
            nextDuration === activeSession.duration &&
            nextProgressEnd === activeSession.progressEnd
          ) return
          set({
            activeSession: {
              ...activeSession,
              completionPercent: nextCompletion,
              duration: nextDuration,
              progressEnd: nextProgressEnd,
            },
          })
        },

        getElapsedSeconds: () => {
          const { activeSession, now } = get()
          if (!activeSession) return 0
          const at = activeSession.runningSince ? Math.max(now, Date.now()) : now
          return sessionTotalSeconds(activeSession, at)
        },

        isTimerRunning: () => {
          const { activeSession } = get()
          return !!activeSession && activeSession.runningSince != null
        },

        getActiveSession: () => get().activeSession,

        getSessionPhase: () => get().sessionPhase,

        /**
         * Stop the current session and permanently record it.
         * If the session continues a previously recorded one, time is appended to
         * that single history entry (no duplicate rows).
         * Returns { completed, isContinuation, newSegmentSeconds } or null when
         * the session is too short to record.
         */
        stopSession: ({ progressEnd, completionPercent } = {}) => {
          const { activeSession, sessions, totalStudySeconds, minSessionSeconds } = get()
          if (!activeSession || activeSession.isCompleted) return null

          const at = Date.now()
          const newSegmentSeconds = activeElapsedSeconds(activeSession, at)
          const elapsedSeconds = sessionTotalSeconds(activeSession, at)
          stopTicker()

          const isContinuation = !!activeSession.continuationOf && activeSession.baseElapsedSeconds > 0
          const finalProgressEnd =
            progressEnd == null
              ? activeSession.progressEnd
              : Math.max(0, Math.min(100, Math.round(progressEnd)))
          const finalCompletion =
            completionPercent == null ? activeSession.completionPercent : completionPercent

          if (newSegmentSeconds < minSessionSeconds) {
            set({
              activeSession: null,
              sessionPhase: SESSION_PHASE.IDLE,
              now: at,
              pausePromptOpen: false,
              lastVideo: {
                id: activeSession.videoId,
                title: activeSession.videoTitle,
                folder: activeSession.folderName,
              },
            })
            return null
          }

          let completed
          let nextSessions = sessions
          if (isContinuation) {
            const parent = sessions.find((s) => s.id === activeSession.continuationOf)
            if (parent) {
              completed = normalizeSession({
                ...parent,
                id: parent.id,
                videoId: activeSession.videoId,
                videoTitle: activeSession.videoTitle,
                videoName: activeSession.videoName,
                folderName: activeSession.folderName,
                sourceName: activeSession.sourceName || parent.sourceName,
                sourceUrl: activeSession.sourceUrl || parent.sourceUrl,
                domain: activeSession.domain || parent.domain,
                courseName: activeSession.courseName || parent.courseName,
                educatorName: activeSession.educatorName || parent.educatorName,
                lessonTitle: activeSession.lessonTitle || parent.lessonTitle,
                topicName: activeSession.topicName || parent.topicName,
                progressStart: parent.progressStart,
                progressEnd: finalProgressEnd,
                elapsedSeconds,
                startTime: parent.startTime,
                endTime: new Date(at).toISOString(),
                completionPercent: Math.max(parent.completionPercent, finalProgressEnd),
                status: 'completed',
              })
              nextSessions = mergeSessions(sessions, [completed])
            } else {
              isContinuation = false
            }
          }

          if (!isContinuation) {
            completed = normalizeSession({
              id: activeSession.id,
              sessionNumber: activeSession.sessionNumber,
              videoId: activeSession.videoId,
              videoTitle: activeSession.videoTitle,
              videoName: activeSession.videoName,
              folderName: activeSession.folderName,
              sourceId: activeSession.sourceId,
              sourceName: activeSession.sourceName,
              sourceUrl: activeSession.sourceUrl,
              domain: activeSession.domain,
              courseId: activeSession.courseId,
              courseName: activeSession.courseName,
              educatorId: activeSession.educatorId,
              educatorName: activeSession.educatorName,
              lessonId: activeSession.lessonId,
              lessonNumber: activeSession.lessonNumber,
              lessonTitle: activeSession.lessonTitle,
              topicId: activeSession.topicId,
              topicName: activeSession.topicName,
              subtopicId: activeSession.subtopicId,
              subtopicName: activeSession.subtopicName,
              contentType: activeSession.contentType,
              progressStart: activeSession.progressStart,
              progressEnd: finalProgressEnd,
              continuationOf: activeSession.continuationOf,
              startTime: activeSession.startTime,
              endTime: new Date(at).toISOString(),
              elapsedSeconds,
              completionPercent: finalCompletion,
              duration: activeSession.duration,
              status: 'completed',
            })
            nextSessions = mergeSessions(sessions, [completed])
          }

          const sessionMeta = {
            id: activeSession.id,
            continuationOf: activeSession.continuationOf,
            sessionNumber: activeSession.sessionNumber,
          }
          set({
            sessions: nextSessions,
            activeSession: null,
            sessionPhase: SESSION_PHASE.COMPLETED,
            totalStudySeconds: totalStudySeconds + newSegmentSeconds,
            lastCompletedSession: completed,
            pausePromptOpen: false,
            now: at,
            lastVideo: {
              id: activeSession.videoId,
              title: activeSession.videoTitle,
              folder: activeSession.folderName,
            },
          })
          return { completed, isContinuation, newSegmentSeconds, ...sessionMeta }
        },

        /**
         * Keep the legacy completeSession API (used by the video player flow).
         */
        completeSession: ({ completionPercent, duration } = {}) => {
          const result = get().stopSession({ completionPercent, duration })
          return result ? result.completed : null
        },

        /**
         * Reset the current uncompleted session. Discarded time is never counted.
         * Returns the discarded session (for messaging) or null.
         */
        resetSession: () => {
          const { activeSession } = get()
          if (!activeSession) return null
          stopTicker()
          const discarded = { ...activeSession, phase: SESSION_PHASE.DISCARDED }
          set({
            activeSession: null,
            sessionPhase: SESSION_PHASE.DISCARDED,
            pausePromptOpen: false,
            now: Date.now(),
            lastVideo: {
              id: activeSession.videoId,
              title: activeSession.videoTitle,
              folder: activeSession.folderName,
            },
          })
          // Phase returns to idle once the discard is acknowledged by the UI.
          setTimeout(() => {
            if (get().sessionPhase === SESSION_PHASE.DISCARDED) {
              set({ sessionPhase: SESSION_PHASE.IDLE })
            }
          }, 0)
          return discarded
        },

        discardSession: () => {
          get().resetSession()
        },

        openPausePrompt: () => set({ pausePromptOpen: true }),
        closePausePrompt: () => set({ pausePromptOpen: false }),

        setPausePreference: (choice, remember) => {
          if (remember && (choice === 'continue' || choice === 'pause')) {
            set({ pausePreference: choice, rememberPauseChoice: true })
          } else if (!remember) {
            set({ pausePreference: null, rememberPauseChoice: false })
          }
        },

        setRememberPauseChoice: (remember) => {
          if (!remember) {
            set({ rememberPauseChoice: false, pausePreference: null })
            return
          }
          set({ rememberPauseChoice: true })
        },

        getCompletedSessions: () => get().sessions.filter((s) => s.status === 'completed'),

        getSessionsCompletedCount: () => get().getCompletedSessions().length,

        getTodayStudySeconds: () => {
          const today = localDateStr(new Date())
          const completed = get()
            .getCompletedSessions()
            .filter((s) => localDateStr(s.startTime) === today)
            .reduce((sum, s) => sum + s.elapsedSeconds, 0)
          const active = get().activeSession
          if (active && localDateStr(active.startTime) === today) {
            return completed + get().getElapsedSeconds()
          }
          return completed
        },

        getWeeklyStudySeconds: () => {
          const now = new Date()
          const weekStart = new Date(now)
          weekStart.setDate(now.getDate() - now.getDay())
          weekStart.setHours(0, 0, 0, 0)
          return get()
            .getCompletedSessions()
            .filter((s) => new Date(s.startTime) >= weekStart)
            .reduce((sum, s) => sum + s.elapsedSeconds, 0)
        },

        getMonthlyStudySeconds: () => {
          const now = new Date()
          return get()
            .getCompletedSessions()
            .filter((s) => {
              const d = new Date(s.startTime)
              return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
            })
            .reduce((sum, s) => sum + s.elapsedSeconds, 0)
        },

        getLifetimeStudySeconds: () =>
          get()
            .getCompletedSessions()
            .reduce((sum, s) => sum + s.elapsedSeconds, 0),

        getSessionHistory: (limit) => {
          const list = [...get().getCompletedSessions()].sort(
            (a, b) => new Date(b.startTime) - new Date(a.startTime)
          )
          return limit ? list.slice(0, limit) : list
        },

        clearHistory: () => set({ sessions: [], totalStudySeconds: 0, lastCompletedSession: null }),
      }
    },
    {
      name: 'study-sessions-storage',
      version: 3,
      partialize: (state) => ({
        sessions: state.sessions,
        activeSession: state.activeSession,
        sessionPhase: state.sessionPhase,
        totalStudySeconds: state.totalStudySeconds,
        minSessionSeconds: state.minSessionSeconds,
        pausePreference: state.pausePreference,
        rememberPauseChoice: state.rememberPauseChoice,
        lastVideo: state.lastVideo,
        lastCompletedSession: state.lastCompletedSession,
      }),
      migrate: (persisted) => {
        if (!persisted) return persisted
        return {
          ...persisted,
          sessions: (persisted.sessions || []).map(normalizeSession).filter(Boolean),
          activeSession: null,
          sessionPhase: SESSION_PHASE.IDLE,
        }
      },
      onRehydrateStorage: () => (state) => {
        if (!state?.activeSession) return
        const session = state.activeSession
        if (session.runningSince != null) {
          useSessionStore.setState({
            activeSession: {
              ...session,
              accumulatedMs: session.accumulatedMs + Math.max(0, Date.now() - session.runningSince),
              runningSince: null,
              status: 'paused',
              phase: SESSION_PHASE.PAUSED,
            },
            sessionPhase: SESSION_PHASE.PAUSED,
            now: Date.now(),
          })
        } else {
          useSessionStore.setState({ sessionPhase: SESSION_PHASE.PAUSED })
        }
      },
    }
  )
)

// Expose the single source of truth to the Document PiP floating controller
// and any other same-origin window.
if (typeof window !== 'undefined') {
  window.__bookmarkHubSessionStore = useSessionStore
}

export default useSessionStore
