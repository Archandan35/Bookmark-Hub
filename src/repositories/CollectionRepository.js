import databaseProvider from '../providers/DatabaseProvider'

const TABLE = 'collections'

export const CollectionRepository = {
  async getAll(userId) {
    const { data, error } = await databaseProvider
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
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

  async getRootCollections(userId) {
    const { data, error } = await databaseProvider
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .is('parent_id', null)
      .order('sort_order', { ascending: true })
    if (error) throw error
    return data || []
  },

  async getChildren(parentId) {
    const { data, error } = await databaseProvider
      .from(TABLE)
      .select('*')
      .eq('parent_id', parentId)
      .order('sort_order', { ascending: true })
    if (error) throw error
    return data || []
  },

  async create(collection) {
    const { data, error } = await databaseProvider
      .from(TABLE)
      .insert(collection)
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

  async move(id, newParentId, newSortOrder) {
    return this.update(id, { parent_id: newParentId, sort_order: newSortOrder })
  },

  async reorder(id, sortOrder) {
    return this.update(id, { sort_order: sortOrder })
  },
}
