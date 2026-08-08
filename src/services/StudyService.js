import { StudySessionRepository } from '../repositories/StudySessionRepository'
import { generateId, localDateStr } from '../utils/helpers'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const StudyService = {
  async getAll(userId) {
    if (!userId) return []
    try {
      return await StudySessionRepository.getAll(userId)
    } catch {
      return []
    }
  },

  async getActive(userId) {
    return StudySessionRepository.getActive(userId)
  },

  _toRecord(userId, session, { status = 'completed' } = {}) {
    const elapsed = Math.max(0, Math.floor(session.elapsedSeconds || session.totalElapsedSeconds || 0))
    return {
      user_id: userId,
      bookmark_id: UUID_RE.test(session.videoId || '') ? session.videoId : null,
      bookmark_title: session.videoTitle || session.lessonTitle || session.courseName || 'Study Session',
      video_id: session.videoId || '',
      video_name: session.videoName || session.videoTitle || session.lessonTitle || '',
      folder_name: session.folderName || '',
      status,
      started_at: session.startTime || new Date().toISOString(),
      ended_at: session.endTime || null,
      total_duration: elapsed,
      elapsed_seconds: elapsed,
      completion_percent: Math.max(0, Math.min(100, Math.round((session.completionPercent ?? session.progressEnd ?? 0) * 10) / 10)),
      session_number: session.sessionNumber || 1,
      video_duration: Math.max(0, Math.floor(session.duration || 0)),
      client_session_id: session.clientSessionId || session.id || null,
      notes: '',
      source_id: session.sourceId || session.source_id || null,
      source_name: session.sourceName || session.source_name || '',
      source_url: session.sourceUrl || session.source_url || '',
      domain: session.domain || '',
      course_id: session.courseId || session.course_id || null,
      course_name: session.courseName || session.course_name || '',
      educator_id: session.educatorId || session.educator_id || null,
      educator_name: session.educatorName || session.educator_name || '',
      lesson_id: session.lessonId || session.lesson_id || null,
      lesson_number: session.lessonNumber ?? session.lesson_number ?? null,
      lesson_title: session.lessonTitle || session.lesson_title || '',
      topic_id: session.topicId || session.topic_id || null,
      topic_name: session.topicName || session.topic_name || '',
      subtopic_id: session.subtopicId || session.subtopic_id || null,
      subtopic_name: session.subtopicName || session.subtopic_name || '',
      content_type: session.contentType || session.content_type || 'video',
      progress_start: Math.max(0, Math.min(100, Math.round(session.progressStart || 0))),
      progress_end: Math.max(0, Math.min(100, Math.round(session.progressEnd || 0))),
      continuation_of: session.continuationOf || session.continuation_of || null,
      base_duration: Math.max(0, Math.floor(session.baseElapsedSeconds || 0)),
    }
  },

  /**
   * Persists the running session state (status active/paused). Called at
   * session start, on pause/resume and periodically — never every second.
   */
  async saveActive(userId, session) {
    if (!userId || !session || session.continuationOf) return null
    const record = this._toRecord(userId, session, { status: session.status || 'active' })
    record.ended_at = null
    try {
      return await StudySessionRepository.upsertActive(record)
    } catch {
      return null
    }
  },

  /**
   * Persists a finalized study session. Safe to call more than once for the
   * same session: `client_session_id` is uniquely indexed per user.
   * When `session.continuationOf` is set the time is appended to the existing
   * recorded session instead of inserting a new history row.
   */
  async saveCompletedSession(userId, session) {
    if (!userId || !session) return null

    // Continuation: append time to the single existing history entry.
    if (session.continuationOf) {
      try {
        const existing = await StudySessionRepository.getById(session.continuationOf)
        if (existing) {
          return await StudySessionRepository.update(session.continuationOf, {
            status: 'completed',
            ended_at: session.endTime || new Date().toISOString(),
            elapsed_seconds: session.elapsedSeconds,
            total_duration: session.elapsedSeconds,
            completion_percent: Math.max(0, Math.min(100, Math.round((session.completionPercent ?? session.progressEnd ?? existing.completion_percent ?? 0) * 10) / 10)),
            progress_end: Math.max(0, Math.min(100, Math.round(session.progressEnd ?? existing.progress_end ?? 0))),
            video_name: session.videoName || existing.video_name || existing.bookmark_title || '',
            source_name: session.sourceName || existing.source_name || '',
            course_name: session.courseName || existing.course_name || '',
            educator_name: session.educatorName || existing.educator_name || '',
            lesson_title: session.lessonTitle || existing.lesson_title || '',
            topic_name: session.topicName || existing.topic_name || '',
          })
        }
      } catch {
        // fall through to a normal insert if the parent cannot be found
      }
    }

    const record = {
      id: UUID_RE.test(session.id || '') ? session.id : generateId(),
      ...this._toRecord(userId, session),
      ended_at: session.endTime || new Date().toISOString(),
    }

    try {
      return await StudySessionRepository.upsertCompleted(record)
    } catch {
      // Older schema (schema version 1): retain only the legacy columns.
      const legacy = {
        id: record.id,
        user_id: record.user_id,
        bookmark_id: record.bookmark_id,
        bookmark_title: record.bookmark_title,
        status: 'stopped',
        started_at: record.started_at,
        ended_at: record.ended_at,
        total_duration: record.total_duration,
        notes: '',
      }
      try {
        return await StudySessionRepository.create(legacy)
      } catch {
        return null
      }
    }
  },

  /** Remove the live active row when a session is discarded. */
  async discardActive(userId, clientSessionId) {
    if (!userId || !clientSessionId) return false
    try {
      return await StudySessionRepository.deleteActive(userId, clientSessionId)
    } catch {
      return false
    }
  },

  async updateProgress(id, elapsedSeconds, completionPercent) {
    return StudySessionRepository.update(id, {
      elapsed_seconds: elapsedSeconds,
      total_duration: elapsedSeconds,
      completion_percent: completionPercent,
    })
  },

  async updateNotes(id, notes) {
    return StudySessionRepository.update(id, { notes })
  },

  async remove(id) {
    return StudySessionRepository.remove(id)
  },

  async getDailyStats(userId, date) {
    return StudySessionRepository.getDailyStats(userId, date)
  },

  async getStudyTotals(userId) {
    return StudySessionRepository.getStudyTotals(userId)
  },

  async getByBookmark(userId, bookmarkId) {
    return StudySessionRepository.getByBookmark(userId, bookmarkId)
  },

  calculateTotalDuration(sessions = []) {
    return sessions.reduce(
      (total, s) => total + (s.elapsed_seconds || s.elapsedSeconds || s.total_duration || 0),
      0
    )
  },

  groupByDate(sessions = []) {
    const grouped = {}
    sessions.forEach((s) => {
      const date = localDateStr(s.started_at || s.startTime)
      if (!date) return
      if (!grouped[date]) grouped[date] = []
      grouped[date].push(s)
    })
    return grouped
  },
}

export default StudyService
