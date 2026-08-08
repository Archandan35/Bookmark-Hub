import databaseProvider from '../providers/DatabaseProvider'

const GOALS = 'goals'
const CATEGORIES = 'goal_categories'
const MILESTONES = 'goal_milestones'
const DAILY = 'daily_goals'

export const GoalRepository = {
  async getAll(userId) {
    const { data, error } = await databaseProvider
      .from(GOALS)
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async create(goal) {
    const { data, error } = await databaseProvider.from(GOALS).insert(goal).select().single()
    if (error) throw error
    return data
  },

  async update(id, updates) {
    const { data, error } = await databaseProvider
      .from(GOALS)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async remove(id) {
    const { error } = await databaseProvider.from(GOALS).delete().eq('id', id)
    if (error) throw error
    return true
  },

  async getCategories(userId) {
    const { data, error } = await databaseProvider
      .from(CATEGORIES)
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true })
    if (error) throw error
    return data || []
  },

  async createCategory(category) {
    const { data, error } = await databaseProvider.from(CATEGORIES).insert(category).select().single()
    if (error) throw error
    return data
  },

  async getMilestones(userId) {
    const { data, error } = await databaseProvider
      .from(MILESTONES)
      .select('*')
      .eq('user_id', userId)
      .order('target_date', { ascending: true })
    if (error) throw error
    return data || []
  },

  async createMilestone(milestone) {
    const { data, error } = await databaseProvider.from(MILESTONES).insert(milestone).select().single()
    if (error) throw error
    return data
  },

  async updateMilestone(id, updates) {
    const { data, error } = await databaseProvider
      .from(MILESTONES)
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async getDailyGoal(userId, date) {
    const { data, error } = await databaseProvider
      .from(DAILY)
      .select('*')
      .eq('user_id', userId)
      .eq('goal_date', date)
      .maybeSingle()
    if (error && error.code !== 'PGRST116') throw error
    return data || null
  },

  async upsertDailyGoal(record) {
    const { data, error } = await databaseProvider
      .from(DAILY)
      .upsert(record, { onConflict: 'user_id,goal_date' })
      .select()
      .single()
    if (error) throw error
    return data
  },
}

export default GoalRepository
