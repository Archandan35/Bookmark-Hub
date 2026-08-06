import { useState } from 'react'
import { Play, Pause, Square, Clock, TrendingUp, BarChart3, Video, FileText, Music, Image } from 'lucide-react'
import { useStudyStore, useBookmarkStore, useAuthStore } from '../hooks/useStore'
import { useAppStore } from '../hooks/useStore'
import { formatDuration, formatRelativeTime } from '../utils/helpers'
import { Button } from '../components/Button'
import { StudyService } from '../services/StudyService'
import { secureLog } from '../utils/security'
import { Player } from '../components/Player'
import { Viewer } from '../components/Viewer'
import { BOOKMARK_TYPES } from '../constants'

export function RightPanel() {
  const { rightPanelOpen } = useAppStore()
  const { user } = useAuthStore()
  const { activeSession, elapsed, status, sessions, setActiveSession, setElapsed, setStatus } = useStudyStore()
  const { bookmarks } = useBookmarkStore()
  const [playerFile, setPlayerFile] = useState(null)
  const [viewerFile, setViewerFile] = useState(null)

  if (!rightPanelOpen) return null

  const recentBookmarks = [...bookmarks]
    .filter(b => b.last_opened_at)
    .sort((a, b) => new Date(b.last_opened_at) - new Date(a.last_opened_at))
    .slice(0, 5)

  const recentSessions = [...sessions]
    .filter(s => s.status === 'stopped')
    .sort((a, b) => new Date(b.started_at) - new Date(a.started_at))
    .slice(0, 4)

  const totalDuration = sessions.reduce((sum, s) => sum + (s.total_duration || 0), 0)
  const avgDaily = sessions.length > 0 ? totalDuration / 7 : 0

  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    return date
  })

  const weeklyData = last7Days.map((date) => {
    const dateStr = date.toISOString().split('T')[0]
    const daySessions = sessions.filter((s) => s.started_at?.startsWith(dateStr) && s.status === 'stopped')
    const hours = daySessions.reduce((sum, s) => sum + (s.total_duration || 0), 0) / 3600
    return {
      day: date.toLocaleDateString('en', { weekday: 'short' }).slice(0, 3),
      hours: parseFloat(hours.toFixed(1)),
    }
  })
  const maxHours = Math.max(...weeklyData.map((d) => d.hours), 1)

  const mediaBookmarks = bookmarks.filter(b =>
    ['video', 'audio', 'image', 'pdf', 'markdown'].includes(b.type)
  ).slice(0, 3)

  const handlePause = async () => {
    if (!activeSession) return
    try {
      await StudyService.pauseSession(activeSession.id, elapsed)
      setStatus('paused')
    } catch (err) {
      secureLog('error', 'Failed to pause session', { error: err.message })
    }
  }

  const handleResume = async () => {
    if (!activeSession) return
    try {
      await StudyService.resumeSession(activeSession.id)
      setStatus('running')
    } catch (err) {
      secureLog('error', 'Failed to resume session', { error: err.message })
    }
  }

  const handleStop = async () => {
    if (!activeSession) return
    try {
      await StudyService.stopSession(activeSession.id, elapsed)
      setActiveSession(null)
      setElapsed(0)
      setStatus('idle')
    } catch (err) {
      secureLog('error', 'Failed to stop session', { error: err.message })
    }
  }

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
                <Button variant="secondary" size="sm" onClick={handlePause}>
                  <Pause size={14} /> Pause
                </Button>
              ) : (
                <Button variant="primary" size="sm" onClick={handleResume}>
                  <Play size={14} /> Resume
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={handleStop}>
                <Square size={14} /> Stop
              </Button>
            </div>
          </div>
        </div>
      )}

      {mediaBookmarks.length > 0 && (
        <div className="right-panel-card">
          <h3 className="right-panel-title">Media Player</h3>
          <div className="media-list">
            {mediaBookmarks.map((b) => (
              <div
                key={b.id}
                className="media-item"
                onClick={() => {
                  if ([BOOKMARK_TYPES.VIDEO, BOOKMARK_TYPES.AUDIO].includes(b.type)) {
                    setPlayerFile(b)
                  } else {
                    setViewerFile(b)
                  }
                }}
                role="button"
                tabIndex={0}
                 onKeyDown={(e) => {
                   if (e.key === 'Enter') {
                     if ([BOOKMARK_TYPES.VIDEO, BOOKMARK_TYPES.AUDIO].includes(b.type)) {
                       setPlayerFile(b)
                     } else {
                       setViewerFile(b)
                     }
                   }
                 }}
              >
                <div className="media-item-icon">
                  {b.type === 'video' && <Video size={14} />}
                  {b.type === 'audio' && <Music size={14} />}
                  {b.type === 'image' && <Image size={14} />}
                  {(b.type === 'pdf' || b.type === 'markdown') && <FileText size={14} />}
                </div>
                <div className="media-item-info">
                  <p className="media-item-name">{b.title}</p>
                  <p className="media-item-type">{b.type}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {playerFile && (
        <Player
          src={playerFile.url}
          title={playerFile.title}
          onEnded={() => setPlayerFile(null)}
        />
      )}

      {viewerFile && (
        <Viewer file={viewerFile} onClose={() => setViewerFile(null)} />
      )}

      <div className="right-panel-card">
        <h3 className="right-panel-title">Recent Activity</h3>
        <div className="activity-list">
          {recentBookmarks.length === 0 && recentSessions.length === 0 ? (
            <p className="empty-state-desc">No recent activity</p>
          ) : (
            <>
              {recentBookmarks.map((b) => (
                <div key={b.id} className="activity-item">
                  <div className="activity-dot" />
                  <div className="activity-content">
                    <p className="activity-name">{b.title}</p>
                    <p className="activity-meta">
                      Opened &middot; {formatRelativeTime(b.last_opened_at)}
                    </p>
                  </div>
                </div>
              ))}
              {recentSessions.map((s) => (
                <div key={s.id} className="activity-item">
                  <div className="activity-dot" />
                  <div className="activity-content">
                    <p className="activity-name">{s.bookmark_title}</p>
                    <p className="activity-meta">
                      Studied {formatDuration(s.total_duration || 0)} &middot; {formatRelativeTime(s.started_at)}
                    </p>
                  </div>
                </div>
              ))}
            </>
          )}
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
            <span>Total: {formatDuration(totalDuration)}</span>
          </div>
          <div className="study-stat">
            <TrendingUp size={14} />
            <span>Avg: {formatDuration(Math.floor(avgDaily))}/day</span>
          </div>
          <div className="study-stat">
            <BarChart3 size={14} />
            <span>Sessions: {sessions.length}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
