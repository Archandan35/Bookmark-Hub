import databaseProvider from '../providers/DatabaseProvider'

const TABLE = 'tags'
const BOOKMARK_TAGS_TABLE = 'bookmark_tags'

export const TagRepository = {
  async getAll(userId) {
    const { data, error } = await databaseProvider
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true })
    if (error) throw error
    return data || []
  },

  async create(userId, name, color = null) {
    const { data, error } = await databaseProvider
      .from(TABLE)
      .insert({ user_id: userId, name, color })
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

  async addToBookmark(bookmarkId, tagId) {
    const { data, error } = await databaseProvider
      .from(BOOKMARK_TAGS_TABLE)
      .insert({ bookmark_id: bookmarkId, tag_id: tagId })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async removeFromBookmark(bookmarkId, tagId) {
    const { error } = await databaseProvider
      .from(BOOKMARK_TAGS_TABLE)
      .delete()
      .eq('bookmark_id', bookmarkId)
      .eq('tag_id', tagId)
    if (error) throw error
    return true
  },

  async getByBookmark(bookmarkId) {
    const { data, error } = await databaseProvider
      .from(BOOKMARK_TAGS_TABLE)
      .select('tag_id')
      .eq('bookmark_id', bookmarkId)
    if (error) throw error
    return data || []
  },
}
