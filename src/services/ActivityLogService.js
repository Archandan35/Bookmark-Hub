import { ActivityLogRepository } from '../repositories/ActivityLogRepository'

export const ActivityLogService = {
  async getAll(userId, limit) {
    return ActivityLogRepository.getAll(userId, limit)
  },

  async log(userId, action, entityType, entityId, metadata) {
    return ActivityLogRepository.logActivity(userId, action, entityType, entityId, metadata)
  },

  async clear(userId) {
    return ActivityLogRepository.clear(userId)
  },
}
