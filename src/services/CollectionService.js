import { CollectionRepository } from '../repositories/CollectionRepository'
import { generateId } from '../utils/helpers'

export const CollectionService = {
  async getAll(userId) {
    return CollectionRepository.getAll(userId)
  },

  async getById(id) {
    return CollectionRepository.getById(id)
  },

  async getTree(userId) {
    const all = await CollectionRepository.getAll(userId)
    return this._buildTree(all)
  },

  _buildTree(collections, parentId = null) {
    return collections
      .filter((c) => c.parent_id === parentId)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map((c) => ({
        ...c,
        children: this._buildTree(collections, c.id),
      }))
  },

  async create(userId, data) {
    const collection = {
      id: generateId(),
      user_id: userId,
      name: data.name,
      description: data.description || '',
      icon: data.icon || 'Folder',
      color: data.color || '#5B3FD6',
      parent_id: data.parent_id || null,
      sort_order: data.sort_order || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    return CollectionRepository.create(collection)
  },

  async update(id, updates) {
    return CollectionRepository.update(id, updates)
  },

  async delete(id) {
    return CollectionRepository.delete(id)
  },

  async move(id, newParentId, newSortOrder) {
    return CollectionRepository.move(id, newParentId, newSortOrder)
  },

  async reorder(id, sortOrder) {
    return CollectionRepository.reorder(id, sortOrder)
  },

  async duplicate(id) {
    const collection = await CollectionRepository.getById(id)
    if (!collection) return null
    const { id: _, created_at, updated_at, ...rest } = collection
    return CollectionRepository.create({
      ...rest,
      name: `${rest.name} (Copy)`,
    })
  },
}
