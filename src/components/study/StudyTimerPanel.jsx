import { useState, useEffect, useRef, useMemo } from 'react'
import {
  Play, Pause, RotateCcw, Square, ExternalLink, Trophy,
  BookOpen, Globe, GraduationCap, Layers, ListOrdered, X,
} from 'lucide-react'
import { useSessionStore, formatHMS } from '../../hooks/useSessionStore'
import { studySessionController } from '../../services/studySessionController'
import { useAuthStore } from '../../hooks/useStore'
import { Button } from '../Button'
import { cn } from '../../utils/helpers'
import { useToast } from '../Toast'
import { StudySessionPipModal } from './StudySessionPipModal'

function Pill({ children, className }) {
  return <span className={cn('study-pill', className)}>{children}</span>
}

export function StudyTimerPanel({ compact = false, dismissible = false, onDismiss, onStartNew }) {
  const { user } = useAuthStore()
  const { addToast } = useToast()
  const activeSession = useSessionStore((s) => s.activeSession)
  const sessionPhase = useSessionStore((s) => s.sessionPhase)
  const lastCompletedSession = useSessionStore((s) => s.lastCompletedSession)
  const getElapsedSeconds = useSessionStore((s) => s.getElapsedSeconds)
  const getTodayStudySeconds = useSessionStore((s) => s.getTodayStudySeconds)
  const getSessionsCompletedCount = useSessionStore((s) => s.getSessionsCompletedCount)
  useSessionStore((s) => s.now)

  const [elapsed, setElapsed] = useState(0)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [progress, setProgress] = useState(0)
  const [pipSupported, setPipSupported] = useState(true)
  const [showPipModal, setShowPipModal] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setPipSupported(studySessionController.isPiPSupported())
  }, [])

  useEffect(() => {
    let mounted = true
    const update = () => {
      if (!mounted) return
      setElapsed(getElapsedSeconds())
    }
    update()
    const interval = setInterval(update, 500)
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [getElapsedSeconds, activeSession?.id])

  useEffect(() => {
    if (activeSession) {
      setProgress(Math.max(0, Math.min(100, Math.round(activeSession.progressEnd || activeSession.completionPercent || 0))))
    }
  }, [activeSession])

  const todaySeconds = useMemo(() => {
    try {
      return getTodayStudySeconds()
    } catch {
      return 0
    }
  }, [getTodayStudySeconds, activeSession?.id, elapsed])

  const todaySessions = useMemo(() => {
    try {
      return getSessionsCompletedCount()
    } catch {
      return 0
    }
  }, [getSessionsCompletedCount, elapsed])

  const isRunning = !!activeSession && activeSession.runningSince != null
  const hasSession = !!activeSession

  const handlePauseResume = () => {
    if (!hasSession) return
    if (isRunning) studySessionController.pause()
    else studySessionController.resume()
  }

  const handleReset = () => {
    if (elapsed > 0) {
      setShowResetConfirm(true)
      return
    }
    studySessionController.resetSession()
    addToast('Session reset', 'info')
  }

  const confirmReset = () => {
    studySessionController.resetSession()
    addToast('Session discarded — not added to study hours', 'info')
    setShowResetConfirm(false)
  }

  const handleStop = async () => {
    const result = await studySessionController.stopStudy()
    if (!result?.completed) {
      addToast('Session too short to record', 'info')
    }
  }

  const handleOpenFloating = async () => {
    if (!studySessionController.isPiPSupported()) {
      addToast('Floating Timer is not supported in this browser.', 'error')
      return
    }
    const pip = await import('../../services/floatingPip')
    const result = await pip.openFloatingTimer()
    if (result.reason === 'unsupported') {
      addToast('Floating Timer is not supported in this browser. Your normal Study Timer still works.', 'error')
    } else if (result.reason === 'error') {
      addToast('Could not open the floating timer. Your normal Study Timer still works.', 'error')
    } else {
      addToast('Opened in floating timer', 'info')
    }
  }

  const handleOpenPipModal = () => {
    setShowPipModal(true)
  }

  const handleContinueLast = async () => {
    await studySessionController.replayContinue()
    setShowPipModal(true)
  }

  const handleOpenSource = () => {
    if (!activeSession?.sourceUrl) {
      addToast('No external link recorded for this session', 'info')
      return
    }
    studySessionController.openSourceUrl()
  }

  const handleProgressChange = (value) => {
    setProgress(value)
    studySessionController.setProgress(value)
  }

  const fmtToday = (seconds) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${h}h ${String(m).padStart(2, '0')}m`
  }

  const phaseLabel = !hasSession
    ? 'IDLE'
    : isRunning
      ? 'ACTIVE'
      : 'PAUSED'

  return (
    <div className={cn('study-timer-panel', compact && 'study-timer-panel--compact')}>
      <div className="study-timer-head">
        <div className="study-timer-title">
          <BookOpen size={16} />
          <span>Study Session</span>
        </div>
        <div className="study-timer-head-right">
          {hasSession && (
            <span className={cn('study-timer-status', isRunning ? 'is-active' : 'is-paused')}>
              <span className="study-timer-dot" />
              {phaseLabel}
            </span>
          )}
          {dismissible && (
            <button
              className="study-timer-dismiss"
              onClick={onDismiss}
              aria-label="Hide Study Session card"
              title="Hide this card (session keeps running)"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {!hasSession ? (
        <div className="study-timer-empty">
          <p>No active study session.</p>
          <p className="study-timer-empty-sub">Start a session to track what you study, where, and with whom.</p>
          {lastCompletedSession && (
            <Button variant="outline" size="sm" onClick={handleContinueLast}>
              <RotateCcw size={14} /> Continue Last Session
            </Button>
          )}
          {onStartNew && (
            <Button variant="primary" size="sm" onClick={handleOpenPipModal}>
              <Play size={14} /> Create New Session
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="study-timer-meta">
            <div className="study-session-name">
              {activeSession.lessonTitle || activeSession.courseName || activeSession.sourceName || 'Study Session'}
            </div>
            <div className="study-badges">
              {activeSession.sourceName && <Pill><Globe size={11} /> {activeSession.sourceName}</Pill>}
              {activeSession.educatorName && <Pill className="pill-educator"><GraduationCap size={11} /> {activeSession.educatorName}</Pill>}
              {activeSession.courseName && <Pill className="pill-course"><Layers size={11} /> {activeSession.courseName}</Pill>}
              {(activeSession.lessonNumber || activeSession.lessonTitle) && (
                <Pill className="pill-lesson"><ListOrdered size={11} /> Lesson {activeSession.lessonNumber || ''}{activeSession.lessonNumber && activeSession.lessonTitle ? ' · ' : ''}{activeSession.lessonTitle || ''}</Pill>
              )}
            </div>
          </div>

          <div className="study-timer-time">{formatHMS(elapsed)}</div>

          <div className="study-timer-controls">
            <button
              className="study-timer-btn primary"
              onClick={handlePauseResume}
              aria-label={isRunning ? 'Pause Study Session' : 'Play Study Session'}
              title={isRunning ? 'Pause' : 'Play / Resume'}
            >
              {isRunning ? <Pause size={18} /> : <Play size={18} />}
            </button>
            <button
              className="study-timer-btn warn"
              onClick={handleReset}
              aria-label="Reset Study Session"
              title="Reset (discard this session)"
            >
              <RotateCcw size={18} />
            </button>
            <button
              className="study-timer-btn danger"
              onClick={handleStop}
              aria-label="Stop and Save Study Session"
              title="Stop and save"
            >
              <Square size={15} />
            </button>
            {activeSession.sourceUrl && (
              <button
                className="study-timer-btn"
                onClick={handleOpenSource}
                aria-label="Open study website"
                title="Open study website"
              >
                <ExternalLink size={16} />
              </button>
            )}
          </div>

          <div className="study-progress-edit">
            <div className="study-progress-label">
              <span>Lesson progress</span>
              <strong>{progress}%</strong>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={progress}
              onChange={(e) => handleProgressChange(Number(e.target.value))}
              aria-label="Update lesson progress"
            />
          </div>
        </>
      )}

      <div className="study-timer-foot">
        <div className="study-timer-stats">
          <span><Trophy size={13} /> Today: <strong>{fmtToday(todaySeconds)}</strong></span>
          <span>Sessions: <strong>{todaySessions}</strong></span>
        </div>
        <button
          className="study-pip-btn"
          onClick={handleOpenPipModal}
          aria-label="Create New Study Session"
          title="Create New Study Session"
        >
          <Play size={15} />
          <span>Create New Session</span>
        </button>
      </div>

      {showResetConfirm && (
        <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && setShowResetConfirm(false)}>
          <div className="confirm-dialog">
            <div className="confirm-dialog-header">
              <span className="confirm-dialog-icon warn"><RotateCcw size={18} /></span>
              <h3>Reset current session?</h3>
              <button className="modal-close-btn" onClick={() => setShowResetConfirm(false)} aria-label="Close dialog">✕</button>
            </div>
            <div className="confirm-dialog-body">
              <p>This discards the current uncompleted session. Discarded time is never added to your study hours.</p>
              <div className="confirm-dialog-current-time">
                <span>Current time</span>
                <strong>{formatHMS(elapsed)}</strong>
              </div>
            </div>
            <div className="confirm-dialog-actions">
              <Button variant="ghost" onClick={() => setShowResetConfirm(false)}>Cancel</Button>
              <Button variant="danger" onClick={confirmReset}>Reset</Button>
            </div>
          </div>
        </div>
      )}
      <StudySessionPipModal open={showPipModal} onClose={() => setShowPipModal(false)} />
    </div>
  )
}

export default StudyTimerPanel
