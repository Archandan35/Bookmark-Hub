import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Target, Plus, Flag, CheckCircle, Clock,
  MoreHorizontal, ArrowRight,
} from 'lucide-react'
import { useAuthStore } from '../hooks/useStore'
import { useSessionStore, formatHMS } from '../hooks/useSessionStore'
import { GoalsService } from '../services/GoalsService'
import { useDailyGoal } from '../hooks/useDailyGoal'
import { StudyService } from '../services/StudyService'
import { EmptyState } from '../components/EmptyState'

const TAB_STATUS = {
  'all-goals': null,
  'daily-goals': 'active',
  archived: 'archived',
}

function formatTargetDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function daysUntil(value) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  const diff = Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24))
  if (diff < 0) return 'Overdue'
  if (diff === 0) return 'Today'
  return `In ${diff} day${diff === 1 ? '' : 's'}`
}

function formatGoalValue(goal) {
  if (goal.goal_type === 'study_time') {
    return `${formatHMS(goal.current_value || 0)} / ${formatHMS(goal.target_value || 0)}`
  }
  return `${goal.current_value || 0} / ${goal.target_value || 0}`
}

function goalValueLabel(goal) {
  if (goal.goal_type === 'study_time') return 'Study Time'
  if (goal.goal_type === 'sessions') return 'Sessions'
  return goal.unit || 'Progress'
}

export function Goals() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [goals, setGoals] = useState([])
  const [categories, setCategories] = useState([])
  const [milestones, setMilestones] = useState([])
  const [loading, setLoading] = useState(true)
  const { targetSeconds: dailyTarget } = useDailyGoal(user?.id)

  const sessions = useSessionStore((s) => s.sessions)
  const addSessions = useSessionStore((s) => s.addSessions)
  const getTodayStudySeconds = useSessionStore((s) => s.getTodayStudySeconds)
  const getLifetimeStudySeconds = useSessionStore((s) => s.getLifetimeStudySeconds)
  const getSessionsCompletedCount = useSessionStore((s) => s.getSessionsCompletedCount)

  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }
    setLoading(true)
    const [goalsData, categoriesData, milestonesData, remoteSessions] = await Promise.all([
      GoalsService.getAll(user.id),
      GoalsService.getCategories(user.id),
      GoalsService.getMilestones(user.id),
      StudyService.getAll(user.id).catch(() => []),
    ])
    setGoals(goalsData)
    setCategories(categoriesData)
    setMilestones(milestonesData)
    addSessions(remoteSessions)
    setLoading(false)
  }, [user, addSessions])

  useEffect(() => { loadData() }, [loadData])

  const todaySeconds = getTodayStudySeconds()
  const lifetimeSeconds = getLifetimeStudySeconds()
  const sessionsCompleted = getSessionsCompletedCount()

  const stats = useMemo(() => GoalsService.computeStats(goals), [goals])

  const dailyGoalPercent = dailyTarget > 0
    ? Math.min(100, Math.round((todaySeconds / dailyTarget) * 100))
    : 0

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'all-goals', label: `All Goals (${goals.length})` },
    { id: 'daily-goals', label: 'Daily Goals' },
    { id: 'milestones', label: `Milestones (${milestones.length})` },
    { id: 'archived', label: 'Archived' },
  ]

  const visibleGoals = useMemo(() => {
    const status = TAB_STATUS[activeTab]
    if (activeTab === 'overview') return goals.filter((g) => g.status === 'active')
    if (status === null) return goals
    if (!status) return goals.filter((g) => g.status === 'active')
    return goals.filter((g) => g.status === status)
  }, [goals, activeTab])

  const categoryCounts = useMemo(() => {
    return categories.map((cat) => ({
      ...cat,
      count: goals.filter((g) => g.category_id === cat.id).length,
    }))
  }, [categories, goals])

  const statCards = [
    {
      id: 'today-study',
      label: "Today's Total Study Hours",
      value: formatHMS(todaySeconds),
      caption: `Target ${formatHMS(dailyTarget)} · ${dailyGoalPercent}%`,
      icon: Clock,
      iconBg: '#E6F1FE',
      iconColor: '#3B82F6',
      isRing: false,
    },
    {
      id: 'progress',
      label: 'Overall Progress',
      value: `${stats.overallProgress}%`,
      caption: `${stats.total} tracked goals`,
      icon: null,
      iconBg: '#E5F6EF',
      iconColor: '#10B981',
      isRing: true,
      ringPercent: stats.overallProgress,
    },
    {
      id: 'sessions-completed',
      label: 'Sessions Completed',
      value: sessionsCompleted.toString(),
      caption: 'Saved study sessions',
      icon: CheckCircle,
      iconBg: '#EFEAFC',
      iconColor: '#8B5CF6',
      isRing: false,
    },
    {
      id: 'study-time',
      label: 'Lifetime Study Time',
      value: formatHMS(lifetimeSeconds),
      caption: `${stats.completed} goals completed`,
      icon: Flag,
      iconBg: '#FFF1E0',
      iconColor: '#F59E0B',
      isRing: false,
    },
  ]

  return (
    <div className="goals-page">
      <div className="goals-content">
        <div className="goals-header">
          <div className="goals-header-left">
            <div className="goals-header-icon">
              <Target size={24} />
            </div>
            <div className="goals-header-text">
              <h1 className="goals-page-title">Goals</h1>
              <p className="goals-page-subtitle">Set goals, track progress and achieve more every day.</p>
            </div>
          </div>
          <button className="goals-create-btn" type="button">
            <Plus size={16} />
            <span>Create New Goal</span>
          </button>
        </div>

        <div className="goals-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`goals-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="goals-stat-cards">
          {statCards.map((card) => (
            <div key={card.id} className="goals-stat-card">
              <div className="goals-stat-icon" style={{ backgroundColor: card.iconBg }}>
                {card.isRing ? (
                  <ProgressRingSVG percent={card.ringPercent} color={card.iconColor} />
                ) : (
                  <card.icon size={20} style={{ color: card.iconColor }} />
                )}
              </div>
              <span className="goals-stat-label">{card.label}</span>
              <span className="goals-stat-value">{card.value}</span>
              <span className="goals-stat-caption">{card.caption}</span>
            </div>
          ))}
        </div>

        {activeTab === 'daily-goals' && (
          <div className="goals-card">
            <div className="goals-card-header">
              <h3 className="goals-card-title">Today's Study Goal</h3>
            </div>
            <div className="goals-daily-body">
              <div className="goals-progress-track">
                <div
                  className="goals-progress-fill"
                  style={{ width: `${dailyGoalPercent}%`, backgroundColor: '#3B82F6' }}
                />
              </div>
              <div className="goals-daily-meta">
                <span>{formatHMS(todaySeconds)} studied</span>
                <span>{formatHMS(dailyTarget)} target</span>
                <span>{dailyGoalPercent}%</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'milestones' ? (
          <div className="goals-card">
            <div className="goals-card-header">
              <h3 className="goals-card-title">Milestones ({milestones.length})</h3>
            </div>
            {milestones.length === 0 ? (
              <EmptyState
                icon={Flag}
                title="No milestones yet"
                description="Add milestones to break large goals into checkpoints."
              />
            ) : (
              <div className="goals-milestones-list">
                {milestones.map((m) => (
                  <div key={m.id} className="goals-milestone-row">
                    <div className="goals-milestone-icon" style={{ backgroundColor: '#E5F6EF', color: m.color }}>
                      <Flag size={16} />
                    </div>
                    <div className="goals-milestone-content">
                      <span className="goals-milestone-title">{m.title}</span>
                      <span className="goals-milestone-target">Target: {formatTargetDate(m.target_date)}</span>
                    </div>
                    <div className="goals-milestone-right">
                      <span className="goals-milestone-percent" style={{ color: m.color }}>
                        {Math.max(0, 100 - (m.progress || 0))}% left
                      </span>
                      <span className="goals-milestone-days">{daysUntil(m.target_date) || '—'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="goals-card goals-active-card">
            <div className="goals-card-header">
              <h3 className="goals-card-title">
                {activeTab === 'archived' ? 'Archived Goals' : 'Active Goals'} ({visibleGoals.length})
              </h3>
            </div>
            {loading ? (
              <div className="goals-active-list">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="goals-goal-row skeleton-row" />
                ))}
              </div>
            ) : visibleGoals.length === 0 ? (
              <EmptyState
                icon={Target}
                title="No goals yet"
                description="Create a goal to start tracking progress against your study time."
              />
            ) : (
              <div className="goals-active-list">
                {visibleGoals.map((goal) => (
                  <div key={goal.id} className="goals-goal-row">
                    <div
                      className="goals-goal-icon"
                      style={{ backgroundColor: goal.icon_bg, color: goal.icon_color }}
                    >
                      <Target size={22} />
                    </div>
                    <div className="goals-goal-content">
                      <span className="goals-goal-title">{goal.title}</span>
                      <span className="goals-goal-desc">{goal.description}</span>
                      <div className="goals-goal-badges">
                        {(goal.tags || []).map((tag) => (
                          <span key={tag} className="goals-badge" style={{ backgroundColor: goal.icon_bg, color: goal.icon_color }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="goals-goal-progress">
                      <div className="goals-progress-track">
                        <div
                          className="goals-progress-fill"
                          style={{ width: `${goal.progress || 0}%`, backgroundColor: goal.progress_color }}
                        />
                      </div>
                      <span className="goals-progress-label">{goal.progress || 0}%</span>
                    </div>
                    <div className="goals-goal-meta">
                      <div className="goals-meta-stack">
                        <span className="goals-meta-bold">{formatGoalValue(goal)}</span>
                        <span className="goals-meta-muted">{goalValueLabel(goal)}</span>
                      </div>
                      <div className="goals-meta-stack">
                        <span className="goals-meta-bold">{formatTargetDate(goal.target_date)}</span>
                        <span className="goals-meta-muted">Target Date</span>
                      </div>
                    </div>
                    <button className="goals-goal-menu" type="button"><MoreHorizontal size={16} /></button>
                  </div>
                ))}
              </div>
            )}
            <div className="goals-card-footer">
              <button className="goals-footer-link" type="button"><Plus size={16} /> Create New Goal</button>
            </div>
          </div>
        )}

        {categoryCounts.length > 0 && (
          <div className="goals-card goals-categories-card">
            <div className="goals-card-header">
              <h3 className="goals-card-title">Goal Categories</h3>
            </div>
            <div className="goals-categories-grid">
              {categoryCounts.map((cat) => (
                <div key={cat.id} className="goals-category-chip">
                  <div className="goals-category-icon" style={{ backgroundColor: cat.icon_bg, color: cat.color }}>
                    <Target size={20} />
                  </div>
                  <div className="goals-category-text">
                    <span className="goals-category-name">{cat.name}</span>
                    <span className="goals-category-count">{cat.count} {cat.count === 1 ? 'Goal' : 'Goals'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function ProgressRingSVG({ percent = 0, color }) {
  const size = 20
  const stroke = 3
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const dashLength = (percent / 100) * circumference

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#D9DEE7" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={`${dashLength} ${circumference - dashLength}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  )
}
