import { StudySessionRepository } from '../repositories/StudySessionRepository'
import { generateId } from '../utils/helpers'

export const StudyService = {
  async getAll(userId) {
    return StudySessionRepository.getAll(userId)
  },

  async getActive(userId) {
    return StudySessionRepository.getActive(userId)
  },

  async startSession(userId, bookmarkId, bookmarkTitle, folderName = 'Unknown Folder') {
    const active = await StudySessionRepository.getActive(userId)
    if (active) {
      await StudySessionRepository.stop(active.id, active.elapsed_seconds || 0)
    }
    const session = {
      id: generateId(),
      user_id: userId,
      bookmark_id: bookmarkId,
      bookmark_title: bookmarkTitle,
      folder_name: folderName,
      status: 'active',
      started_at: new Date().toISOString(),
      ended_at: null,
      total_duration: 0,
      elapsed_seconds: 0,
      completion_percent: 0,
      notes: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    return StudySessionRepository.create(session)
  },

  async pauseSession(id, totalDuration) {
    return StudySessionRepository.pause(id, totalDuration)
  },

  async resumeSession(id) {
    return StudySessionRepository.resume(id)
  },

  async stopSession(id, totalDuration) {
    return StudySessionRepository.stop(id, totalDuration)
  },

  async updateProgress(id, elapsedSeconds, completionPercent) {
    return StudySessionRepository.update(id, {
      elapsed_seconds: elapsedSeconds,
      completion_percent: completionPercent,
    })
  },

  async updateNotes(id, notes) {
    return StudySessionRepository.update(id, { notes })
  },

  async getDailyStats(userId, date) {
    return StudySessionRepository.getDailyStats(userId, date)
  },

  async getWeeklyStats(userId, startDate) {
    return StudySessionRepository.getWeeklyStats(userId, startDate)
  },

  async getByBookmark(userId, bookmarkId) {
    return StudySessionRepository.getByBookmark(userId, bookmarkId)
  },

  calculateTotalDuration(sessions) {
    return sessions.reduce((total, s) => total + (s.elapsed_seconds || s.total_duration || 0), 0)
  },

  groupByDate(sessions) {
    const grouped = {}
    sessions.forEach((s) => {
      const date = new Date(s.started_at).toISOString().split('T')[0]
      if (!grouped[date]) grouped[date] = []
      grouped[date].push(s)
    })
    return grouped
  },
}
