import { SettingsRepository } from '../repositories/SettingsRepository'

export const SettingsService = {
  async get(userId) {
    return SettingsRepository.get(userId)
  },

  async save(userId, settings) {
    return SettingsRepository.upsert(userId, settings)
  },

  async update(userId, settings) {
    return SettingsRepository.update(userId, settings)
  },
}
