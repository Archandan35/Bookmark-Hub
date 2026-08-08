import databaseProvider from '../providers/DatabaseProvider'

const TABLE = 'study_sessions'
const FINISHED = ['stopped', 'completed']

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
      .in('status', ['running', 'active', 'paused'])
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error && error.code !== 'PGRST116') throw error
    return data || null
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

  /**
   * Idempotent save keyed on (user_id, client_session_id) so a session can
   * never be double-counted, even if stop fires more than once.
   */
  async upsertCompleted(session) {
    const { data, error } = await databaseProvider
      .from(TABLE)
      .upsert(session, { onConflict: 'user_id,client_session_id', ignoreDuplicates: false })
      .select()
      .single()
    if (error) throw error
    return data
  },

  /**
   * Persist the running session state (status: active/paused). Keyed on
   * (user_id, client_session_id) so a refresh never duplicates the row.
   */
  async upsertActive(record) {
    const { data, error } = await databaseProvider
      .from(TABLE)
      .upsert(record, { onConflict: 'user_id,client_session_id' })
      .select()
      .single()
    if (error) throw error
    return data
  },

  /**
   * Remove the live active-session row (discard). Returns true when removed.
   */
  async deleteActive(userId, clientSessionId) {
    const { error } = await databaseProvider
      .from(TABLE)
      .delete()
      .eq('user_id', userId)
      .eq('client_session_id', clientSessionId)
    if (error) throw error
    return true
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

  async remove(id) {
    const { error } = await databaseProvider.from(TABLE).delete().eq('id', id)
    if (error) throw error
    return true
  },

  async stop(id, elapsedSeconds, completionPercent = 0) {
    return this.update(id, {
      status: 'completed',
      ended_at: new Date().toISOString(),
      elapsed_seconds: elapsedSeconds,
      total_duration: elapsedSeconds,
      completion_percent: completionPercent,
    })
  },

  async pause(id, elapsedSeconds) {
    return this.update(id, {
      status: 'paused',
      elapsed_seconds: elapsedSeconds,
      total_duration: elapsedSeconds,
    })
  },

  async resume(id) {
    return this.update(id, { status: 'active' })
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
      .in('status', FINISHED)
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
      .in('status', FINISHED)
    if (error) throw error
    return data || []
  },

  /** Server-side aggregation (schema v2 RPC). Returns null if unavailable. */
  async getStudyTotals(userId) {
    try {
      const { data, error } = await databaseProvider.rpc('get_study_totals', { p_user_id: userId })
      if (error) throw error
      return Array.isArray(data) ? data[0] || null : data
    } catch {
      return null
    }
  },
}

export default StudySessionRepository
