import { useState, useEffect } from 'react'
import { Clock, TrendingUp, BarChart3, Calendar, Play, BookOpen } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { ProgressBar } from '../components/ProgressBar'
import { useStudyStore, useAuthStore } from '../hooks/useStore'
import { StudyService } from '../services/StudyService'
import { formatDuration } from '../utils/helpers'

export function Study() {
  const { user } = useAuthStore()
  const { sessions, setSessions, activeSession, elapsed, status } = useStudyStore()
  const [selectedPeriod, setSelectedPeriod] = useState('week')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadSessions()
  }, [user])

  const loadSessions = async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await StudyService.getAll(user.id)
      setSessions(data)
    } catch (err) {
      console.error('Failed to load sessions:', err)
    } finally {
      setLoading(false)
    }
  }

  const totalDuration = sessions.reduce((sum, s) => sum + (s.total_duration || 0), 0)
  const avgDaily = sessions.length > 0 ? totalDuration / 7 : 0

  const weeklyData = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    const dateStr = date.toISOString().split('T')[0]
    const daySessions = sessions.filter((s) => s.started_at?.startsWith(dateStr))
    const hours = daySessions.reduce((sum, s) => sum + (s.total_duration || 0), 0) / 3600
    return {
      day: date.toLocaleDateString('en', { weekday: 'short' }).slice(0, 3),
      hours: parseFloat(hours.toFixed(1)),
      sessions: daySessions.length,
    }
  })

  const maxHours = Math.max(...weeklyData.map((d) => d.hours), 1)
  const recentSessions = sessions.slice(0, 10)

  return (
    <div className="page study-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Study Tracker</h1>
          <p className="page-subtitle">Track your learning progress</p>
        </div>
        <div className="study-period-tabs">
          {['day', 'week', 'month', 'year'].map((period) => (
            <button
              key={period}
              className={`period-tab ${selectedPeriod === period ? 'active' : ''}`}
              onClick={() => setSelectedPeriod(period)}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="study-stats-grid">
        <Card className="study-stat-card">
          <div className="study-stat-icon" style={{ '--icon-bg': '#5B3FD615', '--icon-color': '#5B3FD6' }}>
            <Clock size={22} />
          </div>
          <div>
            <p className="study-stat-label">Total Study Time</p>
            <p className="study-stat-value">{formatDuration(totalDuration)}</p>
            <p className="study-stat-desc">This week</p>
          </div>
        </Card>
        <Card className="study-stat-card">
          <div className="study-stat-icon" style={{ '--icon-bg': '#22C55E15', '--icon-color': '#22C55E' }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="study-stat-label">Daily Average</p>
            <p className="study-stat-value">{formatDuration(Math.floor(avgDaily))}</p>
            <p className="study-stat-desc">Goal: 4h</p>
          </div>
        </Card>
        <Card className="study-stat-card">
          <div className="study-stat-icon" style={{ '--icon-bg': '#F59E0B15', '--icon-color': '#F59E0B' }}>
            <BarChart3 size={22} />
          </div>
          <div>
            <p className="study-stat-label">Sessions</p>
            <p className="study-stat-value">{sessions.length}</p>
            <p className="study-stat-desc">This week</p>
          </div>
        </Card>
        <Card className="study-stat-card">
          <div className="study-stat-icon" style={{ '--icon-bg': '#EC489915', '--icon-color': '#EC4899' }}>
            <BookOpen size={22} />
          </div>
          <div>
            <p className="study-stat-label">Current Streak</p>
            <p className="study-stat-value">7 days</p>
            <p className="study-stat-desc">Keep it up!</p>
          </div>
        </Card>
      </div>

      <div className="study-content-grid">
        <Card className="study-chart-card">
          <h3 className="card-title">Weekly Activity</h3>
          <div className="study-chart">
            {weeklyData.map((d) => (
              <div key={d.day} className="study-chart-bar-wrapper">
                <div className="study-chart-value">{d.hours}h</div>
                <div
                  className="study-chart-bar"
                  style={{ '--bar-height': `${(d.hours / maxHours) * 100}%` }}
                />
                <span className="study-chart-label">{d.day}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="study-sessions-card">
          <h3 className="card-title">Recent Sessions</h3>
          <div className="sessions-list">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="session-item">
                  <div className="skeleton skeleton-text" style={{ width: '100%' }} />
                </div>
              ))
            ) : recentSessions.length === 0 ? (
              <p className="empty-state-desc">No study sessions yet. Start studying to track your progress!</p>
            ) : (
              recentSessions.map((session) => (
                <div key={session.id} className="session-item">
                  <div className="session-item-icon">
                    <Play size={14} />
                  </div>
                  <div className="session-item-content">
                    <p className="session-item-title">{session.bookmark_title || 'Study Session'}</p>
                    <p className="session-item-meta">
                      {formatDuration(session.total_duration || 0)} &middot; {session.started_at ? new Date(session.started_at).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
