import { Play, Pause, Square, Clock, TrendingUp, BarChart3 } from 'lucide-react'
import { useStudyStore } from '../hooks/useStore'
import { formatDuration } from '../utils/helpers'
import { Button } from '../components/Button'
import { useAppStore } from '../hooks/useStore'

export function RightPanel() {
  const { rightPanelOpen } = useAppStore()
  const { activeSession, elapsed, status } = useStudyStore()

  if (!rightPanelOpen) return null

  const recentActivity = [
    { name: 'React Hooks.mp4', activity: 'Watched 67%', time: '2 minutes ago' },
    { name: 'Node.js Docs', activity: 'Opened', time: '15 minutes ago' },
    { name: 'Tailwind CSS', activity: 'Bookmarked', time: '1 hour ago' },
    { name: 'TypeScript Guide', activity: 'Studied 45m', time: '3 hours ago' },
  ]

  const weeklyData = [
    { day: 'Mon', hours: 2.5 },
    { day: 'Tue', hours: 3.2 },
    { day: 'Wed', hours: 1.8 },
    { day: 'Thu', hours: 4.1 },
    { day: 'Fri', hours: 2.9 },
    { day: 'Sat', hours: 3.5 },
    { day: 'Sun', hours: 1.2 },
  ]
  const maxHours = Math.max(...weeklyData.map((d) => d.hours), 1)

  return (
    <aside className="right-panel">
      {activeSession && (
        <div className="right-panel-card">
          <h3 className="right-panel-title">Current Study Session</h3>
          <div className="study-session-card">
            <p className="study-session-file">{activeSession.bookmark_title}</p>
            <div className="study-session-timer">{formatDuration(elapsed)}</div>
            <div className="study-session-controls">
              {status === 'running' ? (
                <Button variant="secondary" size="sm">
                  <Pause size={14} /> Pause
                </Button>
              ) : (
                <Button variant="primary" size="sm">
                  <Play size={14} /> Resume
                </Button>
              )}
              <Button variant="ghost" size="sm">
                <Square size={14} /> Stop
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="right-panel-card">
        <h3 className="right-panel-title">Recent Activity</h3>
        <div className="activity-list">
          {recentActivity.map((item, i) => (
            <div key={i} className="activity-item">
              <div className="activity-dot" />
              <div className="activity-content">
                <p className="activity-name">{item.name}</p>
                <p className="activity-meta">
                  {item.activity} &middot; {item.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="right-panel-card">
        <h3 className="right-panel-title">Study Overview</h3>
        <div className="study-chart">
          {weeklyData.map((d) => (
            <div key={d.day} className="study-chart-bar-wrapper">
              <div
                className="study-chart-bar"
                style={{ '--bar-height': `${(d.hours / maxHours) * 100}%` }}
              />
              <span className="study-chart-label">{d.day}</span>
            </div>
          ))}
        </div>
        <div className="study-stats">
          <div className="study-stat">
            <Clock size={14} />
            <span>Total: 19.2h</span>
          </div>
          <div className="study-stat">
            <TrendingUp size={14} />
            <span>Avg: 2.7h/day</span>
          </div>
          <div className="study-stat">
            <BarChart3 size={14} />
            <span>Sessions: 12</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
