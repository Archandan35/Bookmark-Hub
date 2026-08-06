import { useState } from 'react'
import { Target, Calendar, TrendingUp, Clock, Plus, Check, Star, BookOpen, Play, Clock as ClockIcon, Award, Users, Briefcase, FileText, Brain, Heart, Smile, Users as UsersIcon } from 'lucide-react'
import { useAuthStore } from '../hooks/useStore'

export function StudySessions() {
  const { user } = useAuthStore()
  const [selectedTab, setSelectedTab] = useState('overview')
  const [activeGoals, setActiveGoals] = useState([
    {
      id: '1',
      title: 'React Mastery',
      subtitle: 'Become expert in React',
      tags: ['Development', 'Frontend'],
      progress: 68,
      studyTime: '12h 20m / 20h',
      target: '15 July 2026',
      color: '#2563EB',
      icon: Target,
      category: 'Development',
      status: 'in-progress',
      deadline: '2026-07-15',
      estimatedHours: 20,
      completedHours: 12,
      daysLeft: 45,
      lastStudied: '2 days ago',
    },
    {
      id: '2',
      title: 'Algebra II',
      subtitle: 'Master advanced algebra concepts',
      tags: ['Mathematics', 'Exam'],
      progress: 45,
      studyTime: '8h 30m / 20h',
      target: '01 September 2026',
      color: '#7C3AED',
      icon: Calendar,
      category: 'Exam',
      status: 'in-progress',
      deadline: '2026-09-01',
      estimatedHours: 20,
      completedHours: 8,
      daysLeft: 120,
      lastStudied: '5 days ago',
    },
    {
      id: '3',
      title: 'Physics: Mechanics',
      subtitle: 'Study mechanics and thermodynamics',
      tags: ['Science', 'Lab'],
      progress: 80,
      studyTime: '18h 0m / 25h',
      target: '30 November 2026',
      color: '#22C55E',
      icon: TrendingUp,
      category: 'Science',
      status: 'completed',
      deadline: '2026-11-30',
      estimatedHours: 25,
      completedHours: 18,
      daysLeft: 15,
      lastStudied: '1 day ago',
    },
  ])

  const [goalsOverview] = useState({
    total: 12,
    completed: 3,
    inProgress: 8,
    paused: 1,
    overdue: 2,
    completionRate: 68,
    totalStudyHours: 145,
    averageDailyGoal: 2.5,
  })

  const [goalCategories] = useState([
    { id: 'exam', title: 'Exam', count: 3, color: '#EF4444', icon: Target },
    { id: 'development', title: 'Development', count: 5, color: '#2563EB', icon: TrendingUp },
    { id: 'reading', title: 'Reading', count: 2, color: '#7C3AED', icon: BookOpen },
    { id: 'personal', title: 'Personal', count: 1, color: '#F59E0B', icon: Calendar },
    { id: 'programming', title: 'Programming', count: 8, color: '#10B981', icon: TrendingUp },
    { id: 'law', title: 'Law', count: 1, color: '#6366F1', icon: Target },
    { id: 'medical', title: 'Medical', count: 2, color: '#EC4899', icon: TrendingUp },
    { id: 'finance', title: 'Finance', count: 3, color: '#14B8A6', icon: TrendingUp },
  ])

  const [upcomingMilestones] = useState([
    {
      id: '1',
      title: 'React Mastery - 80% Completion',
      targetDate: '2026-07-20',
      daysLeft: 15,
      color: '#2563EB',
      icon: Target,
      type: 'progress',
    },
    {
      id: '2',
      title: 'Algebra II Final Exam',
      targetDate: '2026-08-15',
      daysLeft: 90,
      color: '#EF4444',
      icon: Calendar,
      type: 'deadline',
    },
    {
      id: '3',
      title: 'Physics Lab Submission',
      targetDate: '2026-07-25',
      daysLeft: 25,
      color: '#10B981',
      icon: Check,
      type: 'milestone',
    },
  ])

  const [recentlyCompleted] = useState([
    {
      id: '1',
      title: 'Machine Learning Fundamentals',
      completionDate: '2026-06-28',
      studyHours: 15,
      icon: TrendingUp,
    },
    {
      id: '2',
      title: 'Calculus Practice Set',
      completionDate: '2026-06-25',
      studyHours: 12,
      icon: Clock,
    },
  ])

  const [statsCards] = useState([
    { icon: Target, label: 'Total Goals', value: 12, color: '#2563EB' },
    { icon: TrendingUp, label: 'Overall Progress', value: '68%', color: '#7C3AED' },
    { icon: Check, label: 'Completed Goals', value: 3, color: '#22C55E' },
    { icon: Calendar, label: 'Study Hours', value: 145, color: '#F59E0B', suffix: 'h' },
    { icon: Clock, label: 'Daily Average', value: 2.5, color: '#10B981', suffix: 'h' },
    { icon: Award, label: 'Completion Rate', value: '68%', color: '#EC4899' },
  ])

  const weeklyData = [
    { day: 'Mon', hours: 3 },
    { day: 'Tue', hours: 4.5 },
    { day: 'Wed', hours: 2 },
    { day: 'Thu', hours: 5 },
    { day: 'Fri', hours: 3.5 },
    { day: 'Sat', hours: 4 },
    { day: 'Sun', hours: 2 },
  ]

  const maxHours = Math.max(...weeklyData.map((d) => d.hours), 1)

  const getStatusColor = (status) => {
    const colors = {
      'not-started': '#CBD5E1',
      'in-progress': '#2563EB',
      'completed': '#22C55E',
      'paused': '#F59E0B',
      'overdue': '#EF4444',
      'archived': '#6B7280',
    }
    return colors[status] || colors['not-started']
  }

  const getStatusLabel = (status) => {
    const labels = {
      'not-started': 'Not Started',
      'in-progress': 'In Progress',
      'completed': 'Completed',
      'paused': 'Paused',
      'overdue': 'Overdue',
      'archived': 'Archived',
    }
    return labels[status] || 'Not Started'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getTabColor = (tab) => {
    const colors = {
      'overview': '#2563EB',
      'all-goals': '#7C3AED',
      'daily-goals': '#22C55E',
      'weekly-goals': '#F59E0B',
      'monthly-goals': '#EC4899',
      'yearly-goals': '#14B8A6',
      'milestones': '#6366F1',
      'archived': '#6B7280',
    }
    return colors[tab] || '#2563EB'
  }

  const getCategoryColor = (category) => {
    const colors = {
      'Development': '#2563EB',
      'Exam': '#EF4444',
      'Science': '#22C55E',
      'Mathematics': '#7C3AED',
      'Programming': '#10B981',
      'Personal': '#F59E0B',
      'Reading': '#6366F1',
      'Law': '#8B5CF6',
      'Medical': '#EC4899',
      'Finance': '#14B8A6',
    }
    return colors[category] || '#6B7280'
  }

  return (
    <div className="page study-sessions-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Study Sessions</h1>
          <p className="page-subtitle">Set goals, track progress and achieve more every day.</p>
        </div>
        <div className="header-right">
          <div className="header-search-row">
            <div className="header-center">
              <div className="search-bar-wrapper">
                <input
                  type="text"
                  placeholder="Search goals..."
                  className="search-input"
                />
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-icon">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
              </div>
            </div>
          </div>
          <button className="create-goal-btn">
            <Plus size={16} /> Create New Goal
          </button>
        </div>
      </div>

      <div className="navigation-tabs">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'all-goals', label: 'All Goals' },
          { id: 'daily-goals', label: 'Daily Goals' },
          { id: 'weekly-goals', label: 'Weekly Goals' },
          { id: 'monthly-goals', label: 'Monthly Goals' },
          { id: 'yearly-goals', label: 'Yearly Goals' },
          { id: 'milestones', label: 'Milestones' },
          { id: 'archived', label: 'Archived' },
        ].map((tab) => (
          <button
            key={tab.id}
            className={`nav-tab ${selectedTab === tab.id ? 'active' : ''}`}
            onClick={() => setSelectedTab(tab.id)}
            style={{ borderBottomColor: selectedTab === tab.id ? getTabColor(tab.id) : 'transparent' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="stats-cards-grid">
        {statsCards.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="stat-card">
              <div className="stat-card-icon" style={{ backgroundColor: stat.color === '#22C55E' ? '#D1FAE5' : stat.color === '#F59E0B' ? '#FEF3C7' : stat.color === '#10B981' ? '#D1FAE5' : stat.color === '#EC4899' ? '#FCE7F3' : '#DBEAFE', color: stat.color }}>
                <Icon size={22} />
              </div>
              <div>
                <p className="stat-card-label">{stat.label}</p>
                <p className="stat-card-value">{stat.value}{stat.suffix || ''}</p>
                <p className="stat-card-subtitle">
                  {stat.label === 'Total Goals' ? 'Goals set' : stat.label === 'Overall Progress' ? 'Completion rate' : stat.label === 'Completed Goals' ? 'Goals completed' : stat.label === 'Study Hours' ? 'Total hours' : stat.label === 'Daily Average' ? 'Daily goal' : stat.label === 'Completion Rate' ? 'Success rate' : ''}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="main-content-grid">
        <div className="active-goals-section">
          <h2 className="section-heading">Active Goals ({activeGoals.length})</h2>

          {activeGoals.map((goal) => {
            const Icon = goal.icon
            return (
              <div key={goal.id} className="goal-card" style={{ borderColor: goal.color === '#22C55E' ? '#D1FAE5' : '#E5E7EB', backgroundColor: goal.color === '#22C55E' ? '#F0FDF4' : '#FFFFFF' }}>
                <div className="goal-card-left">
                  <div className="goal-card-icon" style={{ backgroundColor: goal.color === '#2563EB' ? '#DBEAFE' : goal.color === '#7C3AED' ? '#EDE9FE' : '#D1FAE5', color: goal.color }}>
                    <Icon size={32} />
                  </div>
                  <div className="goal-card-info">
                    <h3 className="goal-card-title" style={{ color: goal.color === '#22C55E' ? '#15803D' : '#1F2937' }}>{goal.title}</h3>
                    <p className="goal-card-subtitle">{goal.subtitle}</p>
                    <div className="goal-card-tags">
                      {goal.tags.map((tag) => (
                        <span key={tag} className="goal-tag" style={{ backgroundColor: `${getCategoryColor(tag)}15`, color: getCategoryColor(tag) }}>{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="goal-card-progress">
                  <div className="progress-bar-container">
                    <div className="progress-bar-bg" style={{ backgroundColor: '#E5E7EB' }}>
                      <div className="progress-bar-fill" style={{ width: `${goal.progress}%`, backgroundColor: goal.color }}></div>
                    </div>
                    <span className="progress-percentage">{goal.progress}%</span>
                  </div>
                </div>

                <div className="goal-card-study-time">
                  <ClockIcon size={16} style={{ color: '#6B7280' }} />
                  <span>{goal.studyTime}</span>
                </div>

                <div className="goal-card-target">
                  <Calendar size={16} style={{ color: '#6B7280' }} />
                  <span>{formatDate(goal.deadline)}</span>
                </div>

                <div className="goal-card-status" style={{ backgroundColor: `${getStatusColor(goal.status)}15`, color: getStatusColor(goal.status) }}>
                  {getStatusLabel(goal.status)}
                </div>

                <button className="goal-card-menu">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="5" cy="12" r="1" />
                    <circle cx="19" cy="12" r="1" />
                  </svg>
                </button>
              </div>
            )
          })}

          <button className="create-goal-btn center">
            <Plus size={16} /> Create New Goal
          </button>
        </div>

        <div className="right-sidebar">
          <div className="goals-overview-card">
            <h3 className="card-title">Goals Overview</h3>
            <div className="donut-chart">
              <div className="donut-ring">
                <div className="donut-segment completed" style={{ '--donut-rotation': '0deg', '--donut-percent': `${(goalsOverview.completed / goalsOverview.total) * 100}%` }}></div>
                <div className="donut-segment in-progress" style={{ '--donut-rotation': `${(goalsOverview.completed / goalsOverview.total) * 360}deg`, '--donut-percent': `${(goalsOverview.inProgress / goalsOverview.total) * 100}%` }}></div>
                <div className="donut-segment other" style={{ '--donut-rotation': `${((goalsOverview.completed + goalsOverview.inProgress) / goalsOverview.total) * 360}deg`, '--donut-percent': `${((goalsOverview.paused + goalsOverview.overdue) / goalsOverview.total) * 100}%` }}></div>
              </div>
              <div className="donut-center">
                <div className="donut-percentage">{goalsOverview.completionRate}%</div>
              </div>
            </div>
            <div className="donut-legend">
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#22C55E' }}></div>
                <span>Completed</span>
                <span>{goalsOverview.completed}</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#2563EB' }}></div>
                <span>In Progress</span>
                <span>{goalsOverview.inProgress}</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#9CA3AF' }}></div>
                <span>Other</span>
                <span>{goalsOverview.paused + goalsOverview.overdue}</span>
              </div>
            </div>
          </div>

          <div className="calendar-card">
            <h3 className="card-title">Calendar</h3>
            <div className="calendar-header">
              <span>June 2026</span>
              <div className="calendar-nav">
                <button>&lt;</button>
                <button>&gt;</button>
              </div>
            </div>
            <div className="calendar-grid">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="calendar-header-cell">{day}</div>
              ))}
              {Array.from({ length: 35 }).map((_, i) => {
                const day = i - 6
                const isToday = day === 15
                const hasDeadline = day === 20
                const hasCompleted = day === 25 && day !== 0
                const isOverdue = day === 10 && day !== 0
                const isUpcoming = day === 30 && day !== 0

                let className = 'calendar-cell'
                if (day > 0 && day <= 30) {
                  className += ` day-${day}`
                  if (isToday) className += ' today'
                  if (hasDeadline) className += ' deadline'
                  if (hasCompleted) className += ' completed'
                  if (isOverdue) className += ' overdue'
                  if (isUpcoming) className += ' upcoming'
                }

                return (
                  <div key={i} className={className}>
                    {day > 0 && day <= 30 ? day : ''}
                  </div>
                )
              })}
            </div>
            <div className="calendar-legend">
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#2563EB' }}></div>
                <span>Today</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#22C55E' }}></div>
                <span>Completed</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#F59E0B' }}></div>
                <span>Upcoming</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#EF4444' }}></div>
                <span>Overdue</span>
              </div>
            </div>
          </div>

          <div className="upcoming-milestones-card">
            <h3 className="card-title">Upcoming Milestones</h3>
            <div className="milestones-list">
              {upcomingMilestones.map((milestone) => {
                const Icon = milestone.icon
                const daysLeftColor = milestone.daysLeft <= 7 ? '#EF4444' : milestone.daysLeft <= 30 ? '#F59E0B' : '#22C55E'
                const daysLeftText = milestone.daysLeft <= 7 ? 'Overdue' : milestone.daysLeft <= 30 ? `${milestone.daysLeft} days left` : `${milestone.daysLeft} days left`

                return (
                  <div key={milestone.id} className="milestone-item">
                    <div className="milestone-icon" style={{ backgroundColor: milestone.color === '#2563EB' ? '#DBEAFE' : milestone.color === '#EF4444' ? '#FEE2E2' : '#D1FAE5', color: milestone.color }}>
                      <Icon size={16} />
                    </div>
                    <div className="milestone-content">
                      <p className="milestone-title">{milestone.title}</p>
                      <p className="milestone-target-date">{formatDate(milestone.targetDate)}</p>
                    </div>
                    <div className="milestone-remaining-time" style={{ color: daysLeftColor }}>
                      {daysLeftText}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="recently-completed-card">
            <h3 className="card-title">Recently Completed</h3>
            <div className="completed-list">
              {recentlyCompleted.map((goal) => {
                const Icon = goal.icon
                return (
                  <div key={goal.id} className="completed-item">
                    <div className="completed-icon" style={{ backgroundColor: '#D1FAE5', color: '#22C55E' }}>
                      <Icon size={16} />
                    </div>
                    <div className="completed-content">
                      <p className="completed-goal-title">{goal.title}</p>
                      <p className="completed-date">Completed on {formatDate(goal.completionDate)}</p>
                    </div>
                    <div className="completed-study-hours">
                      <ClockIcon size={14} style={{ color: '#22C55E' }} />
                      <span>{goal.studyHours}h</span>
                    </div>
                    <div className="completed-check">
                      <Check size={16} style={{ color: '#22C55E' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
