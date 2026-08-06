import { useState } from 'react'
import { Clock, TrendingUp, BarChart3, Calendar, Play, BookOpen } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { ProgressBar } from '../components/ProgressBar'
import { useStudyStore } from '../hooks/useStore'
import { formatDuration } from '../utils/helpers'

export function Study() {
  const { activeSession, elapsed, status } = useStudyStore()
  const [selectedPeriod, setSelectedPeriod] = useState('week')

  const weeklyData = [
    { day: 'Mon', hours: 2.5, sessions: 3 },
    { day: 'Tue', hours: 3.2, sessions: 4 },
    { day: 'Wed', hours: 1.8, sessions: 2 },
    { day: 'Thu', hours: 4.1, sessions: 5 },
    { day: 'Fri', hours: 2.9, sessions: 3 },
    { day: 'Sat', hours: 3.5, sessions: 4 },
    { day: 'Sun', hours: 1.2, sessions: 2 },
  ]
  const maxHours = Math.max(...weeklyData.map((d) => d.hours))

  const recentSessions = [
    { id: '1', title: 'React Hooks Deep Dive', duration: 3600, date: '2 hours ago', type: 'video' },
    { id: '2', title: 'Node.js Event Loop', duration: 2400, date: '5 hours ago', type: 'pdf' },
    { id: '3', title: 'TypeScript Generics', duration: 1800, date: 'Yesterday', type: 'website' },
    { id: '4', title: 'CSS Grid Layout', duration: 4200, date: 'Yesterday', type: 'video' },
    { id: '5', title: 'React Performance', duration: 3000, date: '2 days ago', type: 'video' },
  ]

  const totalWeekly = weeklyData.reduce((sum, d) => sum + d.hours, 0)
  const totalSessions = weeklyData.reduce((sum, d) => sum + d.sessions, 0)
  const avgDaily = totalWeekly / 7

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
            <p className="study-stat-value">{totalWeekly.toFixed(1)}h</p>
            <p className="study-stat-desc">This week</p>
          </div>
        </Card>
        <Card className="study-stat-card">
          <div className="study-stat-icon" style={{ '--icon-bg': '#22C55E15', '--icon-color': '#22C55E' }}>
            <TrendingUp size={22} />
          </div>
          <div>
            <p className="study-stat-label">Daily Average</p>
            <p className="study-stat-value">{avgDaily.toFixed(1)}h</p>
            <p className="study-stat-desc">Goal: 4h</p>
          </div>
        </Card>
        <Card className="study-stat-card">
          <div className="study-stat-icon" style={{ '--icon-bg': '#F59E0B15', '--icon-color': '#F59E0B' }}>
            <BarChart3 size={22} />
          </div>
          <div>
            <p className="study-stat-label">Sessions</p>
            <p className="study-stat-value">{totalSessions}</p>
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
            {recentSessions.map((session) => (
              <div key={session.id} className="session-item">
                <div className="session-item-icon">
                  <Play size={14} />
                </div>
                <div className="session-item-content">
                  <p className="session-item-title">{session.title}</p>
                  <p className="session-item-meta">
                    {formatDuration(session.duration)} &middot; {session.date}
                  </p>
                </div>
                <Button variant="ghost" size="sm">Resume</Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
