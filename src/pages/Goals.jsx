import { useState, useMemo } from 'react'
import {
  Target, Plus, Flag, CheckCircle, Clock,
  GraduationCap, BookOpen, PlayCircle, Heart,
  Code, TrendingUp,
  MoreHorizontal, ArrowRight,
} from 'lucide-react'
import { useAuthStore } from '../hooks/useStore'

export function Goals() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedDay, setSelectedDay] = useState(6)

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'all-goals', label: 'All Goals' },
    { id: 'daily-goals', label: 'Daily Goals' },
    { id: 'milestones', label: 'Milestones' },
    { id: 'archived', label: 'Archived' },
  ]

  const statCards = [
    { id: 'total', label: 'Total Goals', value: '7', caption: 'Active goals', link: 'View all goals', icon: Flag, iconBg: '#E6F1FE', iconColor: '#3B82F6', isRing: false },
    { id: 'progress', label: 'Overall Progress', value: '68%', caption: 'Average progress', link: 'View progress', icon: null, iconBg: '#E5F6EF', iconColor: '#10B981', isRing: true },
    { id: 'completed', label: 'Goals Completed', value: '12', caption: 'Completed goals', link: 'View completed', icon: CheckCircle, iconBg: '#EFEAFC', iconColor: '#8B5CF6', isRing: false },
    { id: 'study-time', label: 'Total Study Time', value: '48h 35m', caption: 'Time towards goals', link: 'View sessions', icon: Clock, iconBg: '#FFF1E0', iconColor: '#F59E0B', isRing: false },
  ]

  const activeGoals = [
    { id: 1, title: 'UGC NET 2025 Preparation', description: 'Complete syllabus and crack UGC NET exam', icon: GraduationCap, iconBg: '#E6F1FE', iconColor: '#3B82F6', progress: 75, progressColor: '#3B82F6', badges: [{ label: 'UGC NET', bg: '#E6F1FE', color: '#3B82F6' }, { label: 'Exam', bg: '#EFEAFC', color: '#8B5CF6' }], time: '15h 30m / 20h', timeLabel: 'Study Time', date: 'Jun 30, 2025', dateLabel: 'Target Date' },
    { id: 2, title: 'React Mastery', description: 'Become expert in React development', icon: BookOpen, iconBg: '#E5F6EF', iconColor: '#10B981', progress: 60, progressColor: '#10B981', badges: [{ label: 'Development', bg: '#E5F6EF', color: '#10B981' }, { label: 'Frontend', bg: '#E6F1FE', color: '#3B82F6' }], time: '12h 20m / 20h', timeLabel: 'Study Time', date: 'Jul 15, 2025', dateLabel: 'Target Date' },
    { id: 3, title: 'Complete JavaScript Course', description: 'Finish advanced JavaScript course', icon: PlayCircle, iconBg: '#EFEAFC', iconColor: '#8B5CF6', progress: 45, progressColor: '#8B5CF6', badges: [{ label: 'JavaScript', bg: '#FFF1E0', color: '#F59E0B' }, { label: 'Course', bg: '#EFEAFC', color: '#8B5CF6' }], time: '6h 45m / 15h', timeLabel: 'Study Time', date: 'Jun 20, 2025', dateLabel: 'Target Date' },
    { id: 4, title: 'Read 20 Books', description: 'Read and summarize 20 books this year', icon: BookOpen, iconBg: '#FFF1E0', iconColor: '#F59E0B', progress: 30, progressColor: '#F59E0B', badges: [{ label: 'Reading', bg: '#FDE7F0', color: '#EC4899' }, { label: 'Personal', bg: '#E6F1FE', color: '#3B82F6' }], time: '6 / 20', timeLabel: 'Books', date: 'Dec 31, 2025', dateLabel: 'Target Date' },
    { id: 5, title: 'Daily Study Habit', description: 'Study at least 2 hours every day', icon: Heart, iconBg: '#FDE7F0', iconColor: '#EC4899', progress: 80, progressColor: '#EC4899', badges: [{ label: 'Habit', bg: '#FDE7F0', color: '#EC4899' }, { label: 'Daily', bg: '#EFEAFC', color: '#8B5CF6' }], time: '64 / 80', timeLabel: 'Days', date: 'Jun 30, 2025', dateLabel: 'Target Date' },
  ]

  const categories = [
    { id: 1, name: 'Exam Preparation', count: '3 Goals', icon: GraduationCap, iconBg: '#E6F1FE', iconColor: '#3B82F6' },
    { id: 2, name: 'Development', count: '2 Goals', icon: Code, iconBg: '#E5F6EF', iconColor: '#10B981' },
    { id: 3, name: 'Personal Growth', count: '1 Goal', icon: TrendingUp, iconBg: '#FFF1E0', iconColor: '#F59E0B' },
    { id: 4, name: 'Reading', count: '1 Goal', icon: BookOpen, iconBg: '#EFEAFC', iconColor: '#8B5CF6' },
  ]

  return (
    <div className="goals-page">
      <div className="goals-content">
        {/* Page Header */}
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
          <button className="goals-create-btn">
            <Plus size={16} />
            <span>Create New Goal</span>
          </button>
        </div>

        {/* Tabs */}
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

        {/* Stat Cards */}
        <div className="goals-stat-cards">
          {statCards.map((card) => (
            <div key={card.id} className="goals-stat-card">
              <div className="goals-stat-icon" style={{ backgroundColor: card.iconBg }}>
                {card.isRing ? (
                  <ProgressRingSVG percent={68} color={card.iconColor} />
                ) : (
                  <card.icon size={20} style={{ color: card.iconColor }} />
                )}
              </div>
              <span className="goals-stat-label">{card.label}</span>
              <span className="goals-stat-value">{card.value}</span>
              <span className="goals-stat-caption">{card.caption}</span>
              <a href="#" className="goals-stat-link">{card.link} <ArrowRight size={12} /></a>
            </div>
          ))}
        </div>

        {/* Active Goals */}
        <div className="goals-card goals-active-card">
          <div className="goals-card-header">
            <h3 className="goals-card-title">Active Goals (5)</h3>
          </div>
          <div className="goals-active-list">
            {activeGoals.map((goal) => (
              <div key={goal.id} className="goals-goal-row">
                <div className="goals-goal-icon" style={{ backgroundColor: goal.iconBg, color: goal.iconColor }}>
                  <goal.icon size={22} />
                </div>
                <div className="goals-goal-content">
                  <span className="goals-goal-title">{goal.title}</span>
                  <span className="goals-goal-desc">{goal.description}</span>
                  <div className="goals-goal-badges">
                    {goal.badges.map((badge, i) => (
                      <span key={i} className="goals-badge" style={{ backgroundColor: badge.bg, color: badge.color }}>{badge.label}</span>
                    ))}
                  </div>
                </div>
                <div className="goals-goal-progress">
                  <div className="goals-progress-track">
                    <div className="goals-progress-fill" style={{ width: `${goal.progress}%`, backgroundColor: goal.progressColor }} />
                  </div>
                  <span className="goals-progress-label">{goal.progress}%</span>
                </div>
                <div className="goals-goal-meta">
                  <div className="goals-meta-stack">
                    <span className="goals-meta-bold">{goal.time}</span>
                    <span className="goals-meta-muted">{goal.timeLabel}</span>
                  </div>
                  <div className="goals-meta-stack">
                    <span className="goals-meta-bold">{goal.date}</span>
                    <span className="goals-meta-muted">{goal.dateLabel}</span>
                  </div>
                </div>
                <button className="goals-goal-menu"><MoreHorizontal size={16} /></button>
              </div>
            ))}
          </div>
          <div className="goals-card-footer">
            <a href="#" className="goals-footer-link"><Plus size={16} /> Create New Goal</a>
          </div>
        </div>

        {/* Goal Categories */}
        <div className="goals-card goals-categories-card">
          <div className="goals-card-header">
            <h3 className="goals-card-title">Goal Categories</h3>
          </div>
          <div className="goals-categories-grid">
            {categories.map((cat) => (
              <div key={cat.id} className="goals-category-chip">
                <div className="goals-category-icon" style={{ backgroundColor: cat.iconBg, color: cat.iconColor }}>
                  <cat.icon size={20} />
                </div>
                <div className="goals-category-text">
                  <span className="goals-category-name">{cat.name}</span>
                  <span className="goals-category-count">{cat.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProgressRingSVG({ percent, color }) {
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
