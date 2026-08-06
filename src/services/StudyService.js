import { StudySessionRepository } from '../repositories/StudySessionRepository'
import { generateId } from '../utils/helpers'

export const StudyService = {
  async getAll(userId) {
    return StudySessionRepository.getAll(userId)
  },

  async getActive(userId) {
    return StudySessionRepository.getActive(userId)
  },

  async startSession(userId, bookmarkId, bookmarkTitle) {
    const active = await StudySessionRepository.getActive(userId)
    if (active) {
      await StudySessionRepository.stop(active.id, active.total_duration || 0)
    }
    const session = {
      id: generateId(),
      user_id: userId,
      bookmark_id: bookmarkId,
      bookmark_title: bookmarkTitle,
      status: 'running',
      started_at: new Date().toISOString(),
      ended_at: null,
      total_duration: 0,
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
    return sessions.reduce((total, s) => total + (s.total_duration || 0), 0)
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
