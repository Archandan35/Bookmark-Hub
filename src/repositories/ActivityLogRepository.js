import databaseProvider from '../providers/DatabaseProvider'

const TABLE = 'activity_logs'

export const ActivityLogRepository = {
  async getAll(userId, limit = 50) {
    const { data, error } = await databaseProvider
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return data || []
  },

  async create(log) {
    const { data, error } = await databaseProvider
      .from(TABLE)
      .insert(log)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async logActivity(userId, action, entityType, entityId, metadata = {}) {
    return this.create({
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
      created_at: new Date().toISOString(),
    })
  },

  async delete(id) {
    const { error } = await databaseProvider
      .from(TABLE)
      .delete()
      .eq('id', id)
    if (error) throw error
    return true
  },

  async clear(userId) {
    const { error } = await databaseProvider
      .from(TABLE)
      .delete()
      .eq('user_id', userId)
    if (error) throw error
    return true
  },
}
