import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useSessionStore = create(
  persist(
    (set, get) => ({
      sessions: [],
      activeSession: null,
      totalStudySeconds: 0,
      sessionNumber: 0,
      lastVideo: null,
      lastPlaybackPosition: 0,
      lastElapsedSeconds: 0,

      startSession: (videoInfo) => {
        const currentNumber = get().sessionNumber + 1
        const session = {
          id: Date.now().toString(),
          sessionId: currentNumber,
          videoId: videoInfo?.id || null,
          videoTitle: videoInfo?.title || 'Unknown Video',
          folderName: videoInfo?.folder || 'Unknown Folder',
          startTime: new Date().toISOString(),
          endTime: null,
          duration: 0,
          elapsedSeconds: 0,
          completionPercent: 0,
          status: 'active',
        }
        set((state) => ({
          activeSession: session,
          sessionNumber: currentNumber,
        }))
        return session
      },

      updateSession: (updates) => {
        const { activeSession } = get()
        if (!activeSession) return
        set({ activeSession: { ...activeSession, ...updates } })
      },

      updateSessionProgress: (elapsedSeconds, completionPercent) => {
        const { activeSession } = get()
        if (!activeSession || activeSession.status !== 'active') return
        set({
          activeSession: {
            ...activeSession,
            elapsedSeconds,
            completionPercent,
          },
          lastElapsedSeconds: elapsedSeconds,
        })
      },

      pauseSession: () => {
        const { activeSession, lastElapsedSeconds } = get()
        if (!activeSession) return
        set({
          activeSession: { ...activeSession, status: 'paused' },
          lastElapsedSeconds: activeSession.elapsedSeconds || 0,
        })
      },

      resumeSession: () => {
        const { activeSession } = get()
        if (!activeSession) return
        set({ activeSession: { ...activeSession, status: 'active' } })
      },

      stopSession: () => {
        const { activeSession, sessions, totalStudySeconds, lastElapsedSeconds } = get()
        if (!activeSession || (activeSession.elapsedSeconds || 0) < 5) {
          set((state) => ({
            activeSession: null,
            lastVideo: activeSession ? {
              id: activeSession.videoId,
              title: activeSession.videoTitle,
              folder: activeSession.folderName,
            } : null,
            lastPlaybackPosition: 0,
            lastElapsedSeconds: 0,
          }))
          return null
        }
        const completedSession = {
          ...activeSession,
          endTime: new Date().toISOString(),
          status: 'completed',
        }
        set({
          sessions: [...sessions, completedSession],
          activeSession: null,
          totalStudySeconds: totalStudySeconds + (activeSession.elapsedSeconds || 0),
          lastVideo: {
            id: activeSession.videoId,
            title: activeSession.videoTitle,
            folder: activeSession.folderName,
          },
          lastPlaybackPosition: activeSession.completionPercent > 0
            ? (activeSession.completionPercent / 100) * (activeSession.duration || 0)
            : 0,
          lastElapsedSeconds: 0,
        })
        return completedSession
      },

      resetSession: () => {
        set({ activeSession: null })
      },

      setRecoveryState: (video, position, elapsed) => {
        set({ lastVideo: video, lastPlaybackPosition: position, lastElapsedSeconds: elapsed })
      },

      getTodayStudySeconds: () => {
        const { sessions } = get()
        const today = new Date().toISOString().split('T')[0]
        return sessions
          .filter((s) => s.startTime?.startsWith(today))
          .reduce((sum, s) => sum + (s.elapsedSeconds || 0), 0)
      },

      getWeeklyStudySeconds: () => {
        const { sessions } = get()
        const now = new Date()
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        weekStart.setHours(0, 0, 0, 0)
        return sessions
          .filter((s) => new Date(s.startTime) >= weekStart)
          .reduce((sum, s) => sum + (s.elapsedSeconds || 0), 0)
      },

      getMonthlyStudySeconds: () => {
        const { sessions } = get()
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        return sessions
          .filter((s) => {
            const d = new Date(s.startTime)
            return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
          })
          .reduce((sum, s) => sum + (s.elapsedSeconds || 0), 0)
      },

      clearHistory: () => {
        set({ sessions: [], totalStudySeconds: 0 })
      },

      setSessions: (sessions) => {
        set({ sessions })
      },
    }),
    {
      name: 'study-sessions-storage',
    }
  )
)
