import { MediaProgressRepository } from '../repositories/MediaProgressRepository'

export const MediaProgressService = {
  async get(userId, bookmarkId) {
    return MediaProgressRepository.get(userId, bookmarkId)
  },

  async getAll(userId) {
    return MediaProgressRepository.getAll(userId)
  },

  async saveProgress(userId, bookmarkId, progress, position) {
    return MediaProgressRepository.updateProgress(userId, bookmarkId, progress, position)
  },

  async deleteProgress(userId, bookmarkId) {
    return MediaProgressRepository.delete(userId, bookmarkId)
  },
}
