import databaseProvider from '../providers/DatabaseProvider'

const TABLE = 'study_sessions'

export const StudySessionRepository = {
  async getAll(userId) {
    const { data, error } = await databaseProvider
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
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

  async getActive(userId) {
    const { data, error } = await databaseProvider
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'running')
      .single()
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async getByBookmark(userId, bookmarkId) {
    const { data, error } = await databaseProvider
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .eq('bookmark_id', bookmarkId)
      .order('started_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async create(session) {
    const { data, error } = await databaseProvider
      .from(TABLE)
      .insert(session)
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

  async stop(id, totalDuration) {
    return this.update(id, {
      status: 'stopped',
      ended_at: new Date().toISOString(),
      total_duration: totalDuration,
    })
  },

  async pause(id, totalDuration) {
    return this.update(id, {
      status: 'paused',
      total_duration: totalDuration,
    })
  },

  async resume(id) {
    return this.update(id, { status: 'running' })
  },

  async getDailyStats(userId, date) {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    const { data, error } = await databaseProvider
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .gte('started_at', startOfDay.toISOString())
      .lte('started_at', endOfDay.toISOString())
      .neq('status', 'running')
    if (error) throw error
    return data || []
  },

  async getWeeklyStats(userId, startDate) {
    const start = new Date(startDate)
    const end = new Date(start)
    end.setDate(end.getDate() + 7)

    const { data, error } = await databaseProvider
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .gte('started_at', start.toISOString())
      .lt('started_at', end.toISOString())
      .neq('status', 'running')
    if (error) throw error
    return data || []
  },
}
