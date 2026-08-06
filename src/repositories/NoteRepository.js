import databaseProvider from '../providers/DatabaseProvider'

const TABLE = 'notes'

export const NoteRepository = {
  async getAll(userId) {
    const { data, error } = await databaseProvider
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
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

  async getByBookmark(userId, bookmarkId) {
    const { data, error } = await databaseProvider
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .eq('bookmark_id', bookmarkId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async create(note) {
    const { data, error } = await databaseProvider
      .from(TABLE)
      .insert(note)
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
}
