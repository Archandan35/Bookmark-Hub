import { useState, useEffect, useCallback } from 'react'
import { Play, Pause, Square, Minimize2, Maximize2 } from 'lucide-react'
import { useStudyStore } from '../hooks/useStore'
import { StudyService } from '../services/StudyService'
import { formatDuration } from '../utils/helpers'
import { Button } from './Button'

export function FloatingTimer() {
  const { activeSession, elapsed, status, setElapsed, setStatus, reset } = useStudyStore()
  const [collapsed, setCollapsed] = useState(false)
  const [collapseTimer, setCollapseTimer] = useState(20)

  useEffect(() => {
    if (status !== 'running' || !activeSession) return
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - new Date(activeSession.started_at).getTime()) / 1000) + (activeSession.total_duration || 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [status, activeSession, setElapsed])

  useEffect(() => {
    if (collapsed || status !== 'running') return
    const interval = setInterval(() => {
      setCollapseTimer((t) => {
        if (t <= 1) {
          setCollapsed(true)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [collapsed, status])

  const handlePause = useCallback(async () => {
    if (!activeSession) return
    await StudyService.pauseSession(activeSession.id, elapsed)
    setStatus('paused')
  }, [activeSession, elapsed, setStatus])

  const handleResume = useCallback(async () => {
    if (!activeSession) return
    await StudyService.resumeSession(activeSession.id)
    setStatus('running')
  }, [activeSession, setStatus])

  const handleStop = useCallback(async () => {
    if (!activeSession) return
    await StudyService.stopSession(activeSession.id, elapsed)
    reset()
  }, [activeSession, elapsed, reset])

  if (!activeSession) return null

  if (collapsed) {
    return (
      <div className="floating-pill" onClick={() => setCollapsed(false)}>
        <span className="floating-pill-dot" />
        <span className="floating-pill-time">{formatDuration(elapsed)}</span>
        <Maximize2 size={12} />
      </div>
    )
  }

  return (
    <div className="floating-timer">
      <div className="floating-timer-header">
        <span className="floating-timer-title">{activeSession.bookmark_title}</span>
        <div className="floating-timer-actions">
          {status === 'running' ? (
            <Button variant="ghost" size="icon" onClick={handlePause}>
              <Pause size={16} />
            </Button>
          ) : (
            <Button variant="ghost" size="icon" onClick={handleResume}>
              <Play size={16} />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={handleStop}>
            <Square size={14} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setCollapsed(true)}>
            <Minimize2 size={16} />
          </Button>
        </div>
      </div>
      <div className="floating-timer-display">{formatDuration(elapsed)}</div>
      <div className="floating-timer-footer">
        <span className="floating-timer-status">{status === 'running' ? 'Studying' : 'Paused'}</span>
        {status === 'running' && (
          <span className="floating-timer-collapse">Auto collapse in {collapseTimer}s</span>
        )}
      </div>
    </div>
  )
}
