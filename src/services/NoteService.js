import { NoteRepository } from '../repositories/NoteRepository'
import { generateId } from '../utils/helpers'

export const NoteService = {
  async getAll(userId) {
    return NoteRepository.getAll(userId)
  },

  async getById(id) {
    return NoteRepository.getById(id)
  },

  async getByBookmark(userId, bookmarkId) {
    return NoteRepository.getByBookmark(userId, bookmarkId)
  },

  async create(userId, data) {
    const note = {
      id: generateId(),
      user_id: userId,
      bookmark_id: data.bookmark_id || null,
      title: data.title || '',
      content: data.content || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    return NoteRepository.create(note)
  },

  async update(id, updates) {
    return NoteRepository.update(id, updates)
  },

  async delete(id) {
    return NoteRepository.delete(id)
  },
}
