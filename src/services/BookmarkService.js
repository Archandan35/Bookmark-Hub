import { BookmarkRepository } from '../repositories/BookmarkRepository'
import { generateId } from '../utils/helpers'

export const BookmarkService = {
  async getAll(userId) {
    return BookmarkRepository.getAll(userId)
  },

  async getById(id) {
    return BookmarkRepository.getById(id)
  },

  async getByCollection(userId, collectionId) {
    return BookmarkRepository.getByCollection(userId, collectionId)
  },

  async create(userId, data) {
    const bookmark = {
      id: generateId(),
      user_id: userId,
      title: data.title,
      description: data.description || '',
      url: data.url || '',
      type: data.type || 'website',
      collection_id: data.collection_id || null,
      thumbnail: data.thumbnail || '',
      tags: data.tags || [],
      is_favorite: data.is_favorite || false,
      is_pinned: data.is_pinned || false,
      progress: 0,
      view_count: 0,
      deleted_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_opened_at: null,
    }
    return BookmarkRepository.create(bookmark)
  },

  async update(id, updates) {
    return BookmarkRepository.update(id, updates)
  },

  async delete(id) {
    return BookmarkRepository.delete(id)
  },

  async softDelete(id) {
    return BookmarkRepository.softDelete(id)
  },

  async restore(id) {
    return BookmarkRepository.restore(id)
  },

  async search(userId, query) {
    return BookmarkRepository.search(userId, query)
  },

  async getFavorites(userId) {
    return BookmarkRepository.getFavorites(userId)
  },

  async getPinned(userId) {
    return BookmarkRepository.getPinned(userId)
  },

  async getRecent(userId, limit) {
    return BookmarkRepository.getRecent(userId, limit)
  },

  async getTrash(userId) {
    return BookmarkRepository.getTrash(userId)
  },

  async toggleFavorite(id, current) {
    return BookmarkRepository.update(id, { is_favorite: !current })
  },

  async togglePin(id, current) {
    return BookmarkRepository.update(id, { is_pinned: !current })
  },

  async updateProgress(id, progress) {
    return BookmarkRepository.updateProgress(id, progress)
  },

  async openBookmark(id) {
    return BookmarkRepository.incrementViews(id)
  },

  async duplicate(id) {
    const bookmark = await BookmarkRepository.getById(id)
    if (!bookmark) return null
    const { id: _, created_at, updated_at, ...rest } = bookmark
    return BookmarkRepository.create({
      ...rest,
      title: `${rest.title} (Copy)`,
    })
  },

  async moveToCollection(id, collectionId) {
    return BookmarkRepository.update(id, { collection_id: collectionId })
  },
}
