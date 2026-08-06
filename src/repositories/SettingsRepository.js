import databaseProvider from '../providers/DatabaseProvider'

const TABLE = 'settings'

export const SettingsRepository = {
  async get(userId) {
    const { data, error } = await databaseProvider
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async upsert(userId, settings) {
    const { data, error } = await databaseProvider
      .from(TABLE)
      .upsert({ user_id: userId, ...settings, updated_at: new Date().toISOString() })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(userId, settings) {
    const { data, error } = await databaseProvider
      .from(TABLE)
      .update({ ...settings, updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .select()
      .single()
    if (error) throw error
    return data
  },
}
