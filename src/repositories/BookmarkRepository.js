import databaseProvider from '../providers/DatabaseProvider'

const TABLE = 'bookmarks'

export const BookmarkRepository = {
  async getAll(userId) {
    const { data, error } = await databaseProvider
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async getById(id) {
    const { data, error } = await databaseProvider
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async getByCollection(userId, collectionId) {
    const { data, error } = await databaseProvider
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .eq('collection_id', collectionId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async create(bookmark) {
    const { data, error } = await databaseProvider
      .from(TABLE)
      .insert(bookmark)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id, updates) {
    const { data, error } = await databaseProvider
      .from(TABLE)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id) {
    const { error } = await databaseProvider
      .from(TABLE)
      .delete()
      .eq('id', id)
    if (error) throw error
    return true
  },

  async softDelete(id) {
    return this.update(id, { deleted_at: new Date().toISOString() })
  },

  async restore(id) {
    return this.update(id, { deleted_at: null })
  },

  async search(userId, query) {
    const { data, error } = await databaseProvider
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,url.ilike.%${query}%`)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async getFavorites(userId) {
    const { data, error } = await databaseProvider
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .eq('is_favorite', true)
      .order('updated_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async getPinned(userId) {
    const { data, error } = await databaseProvider
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .eq('is_pinned', true)
      .order('updated_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async getRecent(userId, limit = 20) {
    const { data, error } = await databaseProvider
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('last_opened_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data || []
  },

  async getTrash(userId) {
    const { data, error } = await databaseProvider
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async updateProgress(id, progress) {
    return this.update(id, { progress })
  },

  async incrementViews(id) {
    const bookmark = await this.getById(id)
    if (bookmark) {
      return this.update(id, { view_count: (bookmark.view_count || 0) + 1, last_opened_at: new Date().toISOString() })
    }
    return null
  },
}
