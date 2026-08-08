import { GoalRepository } from '../repositories/GoalRepository'
import { generateId, localDateStr } from '../utils/helpers'

const DEFAULT_DAILY_TARGET_SECONDS = 5 * 3600

export const GOAL_TYPES = {
  STUDY_TIME: 'study_time',
  SESSIONS: 'sessions',
  COUNT: 'count',
  HABIT: 'habit',
}

function safeProgress(current, target) {
  if (!target || target <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)))
}

export const GoalsService = {
  async getAll(userId) {
    if (!userId) return []
    try {
      return await GoalRepository.getAll(userId)
    } catch {
      return []
    }
  },

  async getCategories(userId) {
    if (!userId) return []
    try {
      return await GoalRepository.getCategories(userId)
    } catch {
      return []
    }
  },

  async getMilestones(userId) {
    if (!userId) return []
    try {
      return await GoalRepository.getMilestones(userId)
    } catch {
      return []
    }
  },

  async create(userId, data) {
    return GoalRepository.create({
      id: generateId(),
      user_id: userId,
      title: data.title,
      description: data.description || '',
      category_id: data.categoryId || null,
      goal_type: data.goalType || GOAL_TYPES.STUDY_TIME,
      target_value: data.targetValue || 0,
      current_value: 0,
      unit: data.unit || (data.goalType === GOAL_TYPES.STUDY_TIME ? 'seconds' : 'count'),
      progress: 0,
      status: 'active',
      completed: false,
      target_date: data.targetDate || null,
      tags: data.tags || [],
      icon: data.icon || 'Target',
      icon_bg: data.iconBg || '#E6F1FE',
      icon_color: data.iconColor || '#3B82F6',
      progress_color: data.progressColor || '#3B82F6',
      sort_order: data.sortOrder || 0,
    })
  },

  async update(id, data) {
    return GoalRepository.update(id, data)
  },

  async delete(id) {
    return GoalRepository.remove(id)
  },

  async toggleComplete(id, completed) {
    return GoalRepository.update(id, {
      completed,
      status: completed ? 'completed' : 'active',
      completed_at: completed ? new Date().toISOString() : null,
    })
  },

  async updateProgress(id, current, target) {
    return GoalRepository.update(id, {
      current_value: current,
      progress: safeProgress(current, target),
    })
  },

  async createCategory(userId, data) {
    return GoalRepository.createCategory({
      id: generateId(),
      user_id: userId,
      name: data.name,
      icon: data.icon || 'Target',
      color: data.color || '#3B82F6',
      icon_bg: data.iconBg || '#E6F1FE',
    })
  },

  async createMilestone(userId, data) {
    return GoalRepository.createMilestone({
      id: generateId(),
      user_id: userId,
      goal_id: data.goalId || null,
      title: data.title,
      description: data.description || '',
      progress: data.progress || 0,
      color: data.color || '#10B981',
      target_date: data.targetDate || null,
      completed: false,
    })
  },

  async getDailyTargetSeconds(userId, date = localDateStr(new Date())) {
    if (!userId) return DEFAULT_DAILY_TARGET_SECONDS
    try {
      const record = await GoalRepository.getDailyGoal(userId, date)
      return record?.target_seconds ?? DEFAULT_DAILY_TARGET_SECONDS
    } catch {
      return DEFAULT_DAILY_TARGET_SECONDS
    }
  },

  async setDailyTargetSeconds(userId, targetSeconds, date = localDateStr(new Date())) {
    return GoalRepository.upsertDailyGoal({
      user_id: userId,
      goal_date: date,
      target_seconds: targetSeconds,
    })
  },

  computeStats(goals = []) {
    const total = goals.length
    const completed = goals.filter((g) => g.completed || g.status === 'completed').length
    const inProgress = goals.filter((g) => !g.completed && (g.progress || 0) > 0).length
    const notStarted = total - completed - inProgress
    const overallProgress = total > 0
      ? Math.round(goals.reduce((sum, g) => sum + (g.progress || 0), 0) / total)
      : 0

    return {
      total,
      completed,
      inProgress,
      notStarted: Math.max(0, notStarted),
      overallProgress,
      percentOf: (value) => (total > 0 ? Math.round((value / total) * 100) : 0),
    }
  },

  DEFAULT_DAILY_TARGET_SECONDS,
}

export default GoalsService
