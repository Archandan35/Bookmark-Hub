import databaseProvider from '../providers/DatabaseProvider'

const TABLE = 'media_progress'

export const MediaProgressRepository = {
  async get(userId, bookmarkId) {
    const { data, error } = await databaseProvider
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .eq('bookmark_id', bookmarkId)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async getAll(userId) {
    const { data, error } = await databaseProvider
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async upsert(userId, bookmarkId, progressData) {
    const { data, error } = await databaseProvider
      .from(TABLE)
      .upsert({
        user_id: userId,
        bookmark_id: bookmarkId,
        ...progressData,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async updateProgress(userId, bookmarkId, progress, position) {
    return this.upsert(userId, bookmarkId, { progress, position })
  },

  async delete(userId, bookmarkId) {
    const { error } = await databaseProvider
      .from(TABLE)
      .delete()
      .eq('user_id', userId)
      .eq('bookmark_id', bookmarkId)
    if (error) throw error
    return true
  },
}
