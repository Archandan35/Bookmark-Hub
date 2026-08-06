import { useState, useEffect, useMemo } from 'react'
import {
  Target, Calendar, Clock, Check, Flag, Plus,
  TrendingUp, Award, BarChart2, Grid3X3, List,
} from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Badge } from '../components/Badge'
import { ProgressBar } from '../components/ProgressBar'
import { Input } from '../components/Input'
import { Select } from '../components/Select'
import { Tabs } from '../components/Tabs'
import { emptyState } from '../components/EmptyState'
import { useAuthStore } from '../hooks/useStore'

export function Goals() {
  const { user } = useAuthStore()
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateGoal, setShowCreateGoal] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [filterType, setFilterType] = useState('all')

  useEffect(() => {
    if (user) {
      loadGoals()
    }
  }, [user])

  const loadGoals = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/goals?userId=${user.id}`)
      const data = await response.json()
      setGoals(data)
    } catch (error) {
      console.error('Failed to load goals:', error)
    } finally {
      setLoading(false)
    }
  }

  const createGoal = async (goalData) => {
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...goalData, userId: user.id }),
      })
      const newGoal = await response.json()
      setGoals([newGoal, ...goals])
      return newGoal
    } catch (error) {
      console.error('Failed to create goal:', error)
      throw error
    }
  }

  const updateGoal = async (id, updates) => {
    try {
      const response = await fetch(`/api/goals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const updatedGoal = await response.json()
      setGoals(goals.map(g => g.id === id ? updatedGoal : g))
      return updatedGoal
    } catch (error) {
      console.error('Failed to update goal:', error)
      throw error
    }
  }

  const deleteGoal = async (id) => {
    try {
      await fetch(`/api/goals/${id}`, { method: 'DELETE' })
      setGoals(goals.filter(g => g.id !== id))
    } catch (error) {
      console.error('Failed to delete goal:', error)
    }
  }

  const stats = useMemo(() => [
    {
      icon: Target,
      label: 'Total Goals',
      value: goals.length,
      color: '#2563EB',
    },
    {
      icon: TrendingUp,
      label: 'Progress',
      value: `${Math.round((goals.filter(g => g.completed).length / goals.length) * 100) || 0}%`,
      desc: `${goals.filter(g => g.completed).length} of ${goals.length} completed`,
      color: '#10B981',
    },
    {
      icon: Check,
      label: 'Completed',
      value: goals.filter(g => g.completed).length,
      color: '#8B5CF6',
    },
    {
      icon: Clock,
      label: 'Study Time',
      value: '48h 35m',
      color: '#F59E0B',
    },
  ], [goals])

  const filteredGoals = useMemo(() => {
    if (filterType === 'all') return goals
    return goals.filter(g => g.category === filterType)
  }, [goals, filterType])

  if (loading) {
    return (
      <div className="goals-page">
        <div className="stats-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="stat-card">
              <div className="skeleton skeleton-text" style={{ width: '48px', height: '48px', borderRadius: '50%' }} />
              <div className="card-body">
                <div className="skeleton skeleton-title" />
                <div className="skeleton skeleton-text" />
                <div className="skeleton skeleton-text" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="goals-page">
      <div className="page-header">
        <div className="page-header-left">
          <div className="page-icon">
            <Target size={48} />
          </div>
          <div className="page-title-section">
            <h1 className="page-title">Goals</h1>
            <p className="page-subtitle">
              Set goals, track progress and achieve more every day.
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={() => setShowCreateGoal(true)}
        >
          <Plus size={20} /> Create Goal
        </Button>
      </div>

      <div className="navigation-tabs">
        <Tabs
          tabs={[
            { id: 'overview', label: 'Overview', icon: BarChart2 },
            { id: 'all-goals', label: 'All Goals', icon: Target },
            { id: 'daily', label: 'Daily Goals', icon: Calendar },
            { id: 'milestones', label: 'Milestones', icon: Flag },
            { id: 'archived', label: 'Archived', icon: Award },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <Card key={stat.label} hover className="stat-card">
            <div className="stat-card-icon" style={{ '--icon-bg': `${stat.color}15`, '--icon-color': stat.color }}>
              <stat.icon size={24} />
            </div>
            <div className="stat-card-content">
              <p className="stat-card-label">{stat.label}</p>
              <p className="stat-card-value">{stat.value}</p>
              {stat.desc && <p className="stat-card-desc">{stat.desc}</p>}
            </div>
          </Card>
        ))}
      </div>

      <Card className="active-goals-card">
        <div className="card-header">
          <h2 className="card-title">Active Goals ({filteredGoals.filter(g => !g.completed).length})</h2>
        </div>
        <div className="goal-categories">
          {['Exam', 'Development', 'Personal', 'Reading', 'JavaScript', 'Habit'].map((category) => (
            <Card key={category} className="category-card">
              <div className="category-icon">
                <Target size={40} />
              </div>
              <div className="category-content">
                <p className="category-title">{category}</p>
                <p className="category-count">
                  {goals.filter(g => g.category === category.toLowerCase()).length} goals
                </p>
              </div>
            </Card>
          ))}
        </div>

        <div className="goals-list">
          {filteredGoals.filter(g => !g.completed).length === 0 ? (
            <div className="empty-state">
              <emptyState
                icon={Target}
                title="No active goals"
                description="Create your first goal to get started"
                action={() => setShowCreateGoal(true)}
                actionLabel="Create Goal"
              />
            </div>
          ) : (
            filteredGoals.filter(g => !g.completed).map((goal) => (
              <div key={goal.id} className="goal-row">
                <div className="goal-row-content">
                  <div className="goal-row-left">
                    <div className="goal-icon" style={{ backgroundColor: goal.color || '#2563EB' }}>
                      <Target size={24} />
                    </div>
                    <div className="goal-info">
                      <h3 className="goal-title">{goal.title}</h3>
                      <p className="goal-subtitle">{goal.description}</p>
                      <div className="goal-tags">
                        {goal.tags?.map(tag => (
                          <span key={tag} className="tag" style={{
                            backgroundColor: tagColors[tag]?.background || '#DBEAFE',
                            color: tagColors[tag]?.text || '#2563EB',
                          }}>
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="progress-bar-container">
                        <div className="progress-bar-track">
                          <div
                            className="progress-bar-fill"
                            style={{
                              width: `${goal.progress}%`,
                              backgroundColor: goal.progress >= 100 ? '#10B981' : goal.color || '#2563EB',
                            }}
                          />
                        </div>
                        <span className="progress-text">{goal.progress}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="goal-row-right">
                    <div className="goal-stats">
                      <div className="goal-stat">
                        <Clock size={16} />
                        <span>{goal.studyTime}</span>
                      </div>
                      <div className="goal-stat">
                        <Target size={16} />
                        <span>{goal.targetDate}</span>
                      </div>
                    </div>
                    <button className="goal-more-menu">
                      <More size={20} />
                    </button>
                  </div>
                </div>
                <div className="goal-divider" />
              </div>
            ))
          )}
        </div>

        {filteredGoals.filter(g => !g.completed).length > 0 && (
          <div className="create-goal-link">
            <button className="create-goal-btn">
              <Plus size={16} /> Create New Goal
            </button>
          </div>
        )}
      </Card>

      {showCreateGoal && (
        <div className="modal-overlay">
          <Card className="goal-form-modal">
            <div className="modal-header">
              <h2>Create New Goal</h2>
              <button onClick={() => setShowCreateGoal(false)}>×</button>
            </div>
            <form className="goal-form">
              <Input label="Goal Title" placeholder="Enter goal title" required />
              <Input label="Description" placeholder="Describe your goal" />
              <Select label="Category" options={[
                { value: 'exam', label: 'Exam' },
                { value: 'development', label: 'Development' },
                { value: 'personal', label: 'Personal' },
                { value: 'reading', label: 'Reading' },
                { value: 'javascript', label: 'JavaScript' },
                { value: 'habit', label: 'Habit' },
              ]} />
              <div className="form-row">
                <Input label="Target Date" type="date" />
                <Input label="Study Time (hours)" type="number" />
              </div>
              <div className="form-actions">
                <Button variant="ghost" onClick={() => setShowCreateGoal(false)}>Cancel</Button>
                <Button variant="primary" type="submit">Create Goal</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
const tagColors = {
  'ugc net': { background: '#DBEAFE', text: '#2563EB' },
  'exam': { background: '#EDE9FE', text: '#7C3AED' },
  'development': { background: '#DCFCE7', text: '#16A34A' },
  'frontend': { background: '#ECFDF5', text: '#059669' },
  'javascript': { background: '#F3E8FF', text: '#8B5CF6' },
  'reading': { background: '#FFF7ED', text: '#EA580C' },
  'habit': { background: '#FCE7F3', text: '#DB2777' },
}
const More = (props) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
  </svg>
)
