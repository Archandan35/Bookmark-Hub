import { useSessionStore, VIDEO_STATE } from '../hooks/useSessionStore'
import { playerBridge } from './playerBridge'
import { StudyService } from './StudyService'
import { StudyEntityService } from './StudyEntityService'
import { StudySessionRepository } from '../repositories/StudySessionRepository'

let currentUserId = null
let currentVideo = null
let finalizing = false
let persistenceTimer = null
const savedIds = new Set()

const PERSIST_INTERVAL_MS = 30000

function store() {
  return useSessionStore.getState()
}

function completionFromPlayer() {
  const duration = playerBridge.getDuration()
  const time = playerBridge.getCurrentTime()
  if (!duration || duration <= 0) return { completionPercent: undefined, duration: undefined }
  return { completionPercent: Math.round((time / duration) * 1000) / 10, duration: Math.floor(duration) }
}

async function persist(session) {
  if (!session || !currentUserId || savedIds.has(session.id)) return
  savedIds.add(session.id)
  try {
    await StudyService.saveCompletedSession(currentUserId, session)
  } catch {
    // Local persisted store remains the source of truth if remote save fails
  }
}

function startPersistencePump() {
  stopPersistencePump()
  persistenceTimer = setInterval(async () => {
    const s = store()
    if (!s.activeSession || !currentUserId) return
    await StudyService.saveActive(currentUserId, s.activeSession)
  }, PERSIST_INTERVAL_MS)
}

function stopPersistencePump() {
  if (persistenceTimer !== null) {
    clearInterval(persistenceTimer)
    persistenceTimer = null
  }
}

export const studySessionController = {
  setUser(userId) {
    currentUserId = userId || null
    if (currentUserId) startPersistencePump()
    else stopPersistencePump()
  },

  setVideo(video) {
    currentVideo = video || null
    store().setVideoState(video ? VIDEO_STATE.READY : VIDEO_STATE.NO_VIDEO)
  },

  getVideo() {
    return currentVideo
  },

  onVideoPlay() {
    const s = store()
    s.setVideoState(VIDEO_STATE.PLAYING)
    s.closePausePrompt()
    if (!s.activeSession) {
      s.startSession({
        id: currentVideo?.id || currentVideo?.path || currentVideo?.name || null,
        title: currentVideo?.name || 'Unknown Video',
        name: currentVideo?.name || 'Unknown Video',
        folder: currentVideo?.folder || '',
        duration: playerBridge.getDuration(),
      })
      return
    }
    s.resumeTimer()
  },

  onVideoPause() {
    const s = store()
    s.setVideoState(VIDEO_STATE.PAUSED)
    if (!s.activeSession) return

    if (s.rememberPauseChoice && s.pausePreference) {
      if (s.pausePreference === 'pause') s.pauseTimer()
      return
    }
    s.openPausePrompt()
  },

  resolvePausePrompt(choice, remember) {
    const s = store()
    s.setPausePreference(choice, remember)
    if (choice === 'pause') s.pauseTimer()
    s.closePausePrompt()
  },

  pauseFromTimer() {
    const s = store()
    if (!s.activeSession) return
    playerBridge.pauseSilently ? playerBridge.pauseSilently() : playerBridge.pause()
    s.pauseTimer()
    s.setVideoState(VIDEO_STATE.PAUSED)
    s.closePausePrompt()
  },

  playFromTimer() {
    const s = store()
    if (!currentVideo) return
    if (s.activeSession) s.resumeTimer()
    playerBridge.play()
  },

  /**
   * Pause the active study session (no video dependency). The PiP controller
   * and Bookmark Hub timer both call this same method.
   */
  async pause() {
    const s = store()
    if (!s.activeSession) return
    s.pauseTimer()
    playerBridge.pauseSilently ? playerBridge.pauseSilently() : playerBridge.pause()
    s.setVideoState(VIDEO_STATE.PAUSED)
    s.closePausePrompt()
    if (s.activeSession) await StudyService.saveActive(currentUserId, s.activeSession)
  },

  async resume() {
    const s = store()
    if (!s.activeSession) return
    s.resumeTimer()
    if (s.activeSession) await StudyService.saveActive(currentUserId, s.activeSession)
  },

  /**
   * Start a study session with full dimensional metadata.
   * meta: { sourceId, sourceName, sourceUrl, domain, courseId, courseName,
   *         educatorId, educatorName, lessonId, lessonNumber, lessonTitle,
   *         topicId, topicName, subtopicId, subtopicName, contentType, progressStart }
   */
  async startStudy(meta = {}) {
    const s = store()
    const session = s.startStudySession(meta)
    if (!session) return store().activeSession
    await StudyService.saveActive(currentUserId, session)
    return session
  },

  /** Start an entirely fresh session (after a completed one). */
  async startNew(meta = {}) {
    const current = store().activeSession
    if (current) {
      await this.resetSession()
    }
    return this.startStudy(meta)
  },

  /**
   * Continue from the last recorded session — no new session entity is created.
   * meta: { continuationOf, baseElapsedSeconds, ...same fields }
   */
  async startReplay(meta = {}) {
    const s = store()
    const session = s.startStudySession(meta)
    if (!session) return store().activeSession
    // Continuation sessions intentionally share the parent history row, so no
    // separate active row is written.
    return session
  },

  /** Continue from the last completed session using its stored metadata. */
  async replayContinue() {
    const last = store().lastCompletedSession
    if (!last) return null
    const meta = {
      continuationOf: last.id,
      baseElapsedSeconds: last.elapsedSeconds,
      videoInfo: { id: last.videoId, title: last.videoTitle, name: last.videoName, folder: last.folderName, duration: last.duration },
      sourceId: last.sourceId,
      sourceName: last.sourceName,
      sourceUrl: last.sourceUrl,
      domain: last.domain,
      courseId: last.courseId,
      courseName: last.courseName,
      educatorId: last.educatorId,
      educatorName: last.educatorName,
      lessonId: last.lessonId,
      lessonNumber: last.lessonNumber,
      lessonTitle: last.lessonTitle,
      topicId: last.topicId,
      topicName: last.topicName,
      subtopicId: last.subtopicId,
      subtopicName: last.subtopicName,
      contentType: last.contentType || 'video',
      progressStart: last.progressEnd || last.progressStart || 0,
      progressEnd: last.progressEnd || last.progressStart || 0,
    }
    return this.startReplay(meta)
  },

  async resetSession() {
    const s = store()
    const active = s.activeSession
    const clientId = active?.id
    const discarded = s.resetSession()
    if (clientId) await StudyService.discardActive(currentUserId, clientId)
    return discarded
  },

  /**
   * Stop the session, record it exactly once, and return the completed result
   * { completed, isContinuation, newSegmentSeconds } or null when too short.
   */
  async stopStudy({ progressEnd, completionPercent } = {}) {
    if (finalizing) return null
    finalizing = true
    try {
      const s = store()
      const active = s.activeSession
      const result = s.stopSession({ progressEnd, completionPercent })
      if (!result) return null

      if (!result.isContinuation && active?.id) {
        await StudyService.discardActive(currentUserId, active.id)
      }

      const payload = {
        ...result.completed,
        elapsedSeconds: result.completed.elapsedSeconds,
        progressEnd: result.completed.progressEnd,
        continuationOf: result.isContinuation ? active.continuationOf : null,
        baseElapsedSeconds: active?.baseElapsedSeconds || 0,
      }
      await StudyService.saveCompletedSession(currentUserId, payload)

      if (payload.lessonId) {
        await StudyEntityService.updateLessonProgress(
          currentUserId,
          payload.lessonId,
          payload.progressEnd
        )
      }
      return result
    } finally {
      setTimeout(() => { finalizing = false }, 300)
    }
  },

  /** Set the ending progress for the active session. */
  setProgress(progressEnd) {
    const s = store()
    if (!s.activeSession) return
    s.updateProgress({ progressEnd })
  },

  /** Open the external study destination associated with the active session. */
  openSourceUrl() {
    const s = store()
    const url = s.activeSession?.sourceUrl
    if (!url) return
    window.open(url, '_blank', 'noopener')
  },

  isPiPSupported() {
    return typeof window !== 'undefined' && 'documentPictureInPicture' in window
  },

  /**
   * Check whether another device has an active study session.
   * Returns the remote row or null.
   */
  async checkActiveOnServer(userId = currentUserId) {
    if (!userId) return null
    try {
      return await StudySessionRepository.getActive(userId)
    } catch {
      return null
    }
  },

  /**
   * Adopt a remote active session into this browser (multi-device recovery).
   * The adopted session starts in the paused state with its recorded time.
   */
  adoptRemoteSession(row) {
    const s = store()
    if (s.activeSession) return null
    const startedAt = Date.now()
    const base = Math.max(0, Math.floor(Number(row.elapsed_seconds || row.total_duration || 0) || 0))
    const session = {
      id: row.client_session_id || row.id,
      dbId: row.id,
      sessionNumber: row.session_number || 1,
      videoId: row.video_id || row.bookmark_id || null,
      videoTitle: row.bookmark_title || row.video_name || 'Study Session',
      videoName: row.video_name || row.bookmark_title || 'Study Session',
      folderName: row.folder_name || '',
      sourceId: row.source_id || null,
      sourceName: row.source_name || '',
      sourceUrl: row.source_url || '',
      domain: row.domain || '',
      courseId: row.course_id || null,
      courseName: row.course_name || '',
      educatorId: row.educator_id || null,
      educatorName: row.educator_name || '',
      lessonId: row.lesson_id || null,
      lessonNumber: row.lesson_number || null,
      lessonTitle: row.lesson_title || '',
      topicId: row.topic_id || null,
      topicName: row.topic_name || '',
      subtopicId: row.subtopic_id || null,
      subtopicName: row.subtopic_name || '',
      contentType: row.content_type || 'video',
      progressStart: row.progress_start || 0,
      progressEnd: row.progress_end || 0,
      continuationOf: row.continuation_of || null,
      baseElapsedSeconds: base,
      startTime: row.started_at || new Date(startedAt).toISOString(),
      startedAt,
      accumulatedMs: 0,
      runningSince: null,
      completionPercent: row.progress_end || row.completion_percent || 0,
      duration: row.video_duration || 0,
      status: 'paused',
      phase: 'paused',
      isCompleted: false,
      adopted: true,
      dbActiveRow: row.id,
    }
    s.adoptActiveSession?.(session)
    return session
  },

  async stop() {
    if (finalizing) return null
    finalizing = true
    try {
      const s = store()
      const progress = { completionPercent: undefined, duration: undefined }
      const session = s.completeSession(progress)
      playerBridge.stop()
      store().setVideoState(currentVideo ? VIDEO_STATE.STOPPED : VIDEO_STATE.NO_VIDEO)
      if (session) await persist(session)
      return session
    } finally {
      setTimeout(() => { finalizing = false }, 300)
    }
  },

  async replay() {
    await this.stop()
    const s = store()
    s.startSession({
      id: currentVideo?.id || currentVideo?.path || currentVideo?.name || null,
      title: currentVideo?.name || 'Unknown Video',
      name: currentVideo?.name || 'Unknown Video',
      folder: currentVideo?.folder || '',
      duration: playerBridge.getDuration(),
    })
    store().setVideoState(VIDEO_STATE.PLAYING)
    playerBridge.replay()
  },

  async unloadVideo() {
    if (store().activeSession) {
      await this.stop()
    }
    currentVideo = null
    store().setVideoState(VIDEO_STATE.NO_VIDEO)
  },

  recoverOrphanSession() {
    const s = store()
    if (!s.activeSession) return null
    const session = s.completeSession()
    if (session) persist(session)
    s.setVideoState(currentVideo ? VIDEO_STATE.READY : VIDEO_STATE.NO_VIDEO)
    return session
  },

  finalizeOnUnload() {
    const s = store()
    if (!s.activeSession) return
    const session = s.completeSession(completionFromPlayer())
    if (session) persist(session)
  },

  syncProgress() {
    const s = store()
    if (!s.activeSession) return
    const { completionPercent, duration } = completionFromPlayer()
    if (completionPercent == null) return
    s.updateProgress({ completionPercent, duration })
  },
}

// Expose the controller to the Document PiP floating window (same-origin).
if (typeof window !== 'undefined') {
  window.__studySessionController = studySessionController
}

export default studySessionController
