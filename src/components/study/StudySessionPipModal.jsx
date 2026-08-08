import { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, RotateCw, Square, Globe, GraduationCap, Layers, PictureInPicture2, Plus } from 'lucide-react'
import { Modal } from '../Modal'
import { Button } from '../Button'
import { cn } from '../../utils/helpers'
import { useSessionStore, formatHMS } from '../../hooks/useSessionStore'
import { useAuthStore } from '../../hooks/useStore'
import { studySessionController } from '../../services/studySessionController'
import { useToast } from '../Toast'

const STATES = { FORM: 'form', RUNNING: 'running' }

export function StudySessionPipModal({ open, onClose }) {
  const { user } = useAuthStore()
  const { addToast } = useToast()
  const [step, setStep] = useState(STATES.FORM)

  const activeSession = useSessionStore((s) => s.activeSession)
  const sessionPhase = useSessionStore((s) => s.sessionPhase)
  const getElapsedSeconds = useSessionStore((s) => s.getElapsedSeconds)
  const getTodayStudySeconds = useSessionStore((s) => s.getTodayStudySeconds)
  const getSessionsCompletedCount = useSessionStore((s) => s.getSessionsCompletedCount)
  const lastCompletedSession = useSessionStore((s) => s.lastCompletedSession)
  const now = useSessionStore((s) => s.now)

  const [courseName, setCourseName] = useState('')
  const [lessonNo, setLessonNo] = useState('')
  const [sourceName, setSourceName] = useState('')
  const [educatorName, setEducatorName] = useState('')
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')

  const isRunning = !!activeSession && activeSession.runningSince != null
  const hasSession = !!activeSession
  const completed = sessionPhase === 'completed'

  useEffect(() => {
    if (open) {
      if (hasSession && !completed) {
        setStep(STATES.RUNNING)
      } else {
        setStep(STATES.FORM)
        setCourseName('')
        setLessonNo('')
        setSourceName('')
        setEducatorName('')
        setError('')
      }
    }
  }, [open, hasSession, completed])

  const elapsed = typeof getElapsedSeconds === 'function' ? getElapsedSeconds() : 0
  const todaySeconds = (typeof getTodayStudySeconds === 'function' ? getTodayStudySeconds() : 0)
  const todayCount = (typeof getSessionsCompletedCount === 'function' ? getSessionsCompletedCount() : 0)

  const fmtToday = (seconds) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return `${h}h ${String(m).padStart(2, '0')}m`
  }

  function hasInProgressSession() {
    try {
      const s = useSessionStore.getState()
      const phase = s.sessionPhase
      const active = s.activeSession
      return !!active && phase !== 'completed' && phase !== 'discarded' && phase !== 'idle'
    } catch (e) { return false }
  }

  const handleStart = async () => {
    const course = courseName.trim()
    if (!course) {
      setError('Enter a course name')
      return
    }
    setStarting(true)
    setError('')
    try {
      if (hasInProgressSession()) {
        await studySessionController.stopStudy()
      }
      const meta = {
        courseName: course,
        lessonNumber: lessonNo ? Math.max(1, Math.floor(Number(lessonNo))) : null,
        sourceName: sourceName.trim() || null,
        educatorName: educatorName.trim() || null,
        contentType: 'video',
      }
      await studySessionController.startNew(meta)
      setStep(STATES.RUNNING)
      addToast('Study session started', 'info')
    } catch (err) {
      setError(err?.message || 'Could not start the session')
    } finally {
      setStarting(false)
    }
  }

  const handlePauseResume = () => {
    if (!hasSession || completed) return
    if (isRunning) studySessionController.pause()
    else studySessionController.resume()
  }

  const handleStop = async () => {
    if (!hasSession) return
    await studySessionController.stopStudy()
    setStep(STATES.FORM)
    addToast('Session saved', 'info')
  }

  const handleReset = () => {
    if (!hasSession) return
    studySessionController.resetSession()
    setStep(STATES.FORM)
    addToast('Session reset', 'info')
  }

  const handleNewSession = async () => {
    // Persist and close any currently-open session before starting fresh.
    if (hasSession && !completed) {
      try {
        await studySessionController.stopStudy()
      } catch (e) {
        // best-effort: clear anyway so the form can start a new session
        try { studySessionController.resetSession() } catch {}
      }
    }
    setCourseName('')
    setLessonNo('')
    setSourceName('')
    setEducatorName('')
    setError('')
    await Promise.resolve() // let the store flush the stop before re-rendering controls
    setStep(STATES.FORM)
  }

  const handleOpenFloating = async () => {
    if (!studySessionController.isPiPSupported()) {
      addToast('Floating Timer is not supported in this browser.', 'error')
      return
    }
    try {
      const pip = await import('../../services/floatingPip')
      const result = await pip.openFloatingTimer()
      if (result.reason === 'unsupported') {
        addToast('Floating Timer is not supported in this browser.', 'error')
      } else if (result.reason === 'error') {
        addToast('Could not open the floating timer.', 'error')
      } else {
        addToast('Opened in floating timer', 'info')
        onClose()
      }
    } catch (err) {
      addToast('Could not open the floating timer.', 'error')
    }
  }

  const phaseLabel = !hasSession
    ? 'IDLE'
    : isRunning
      ? 'ACTIVE'
      : 'PAUSED'



  const renderForm = () => (
    <div className="study-pip-form">
      <div className="study-pip-field">
        <label>Course Name</label>
        <input
          value={courseName}
          onChange={(e) => setCourseName(e.target.value)}
          placeholder="e.g. React JS Complete Course"
          disabled={starting}
        />
      </div>
        <div className="study-pip-field">
          <label>Lesson No.</label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={lessonNo}
            onChange={(e) => setLessonNo(e.target.value)}
            placeholder="e.g. 6"
            disabled={starting}
          />
        </div>
      <div className="study-pip-row">
        <div className="study-pip-field">
          <label>Source</label>
          <input
            value={sourceName}
            onChange={(e) => setSourceName(e.target.value)}
            placeholder="e.g. YouTube"
            disabled={starting}
          />
        </div>
        <div className="study-pip-field">
          <label>Educator</label>
          <input
            value={educatorName}
            onChange={(e) => setEducatorName(e.target.value)}
            placeholder="e.g. Code With Harry"
            disabled={starting}
          />
        </div>
      </div>
      {error && <div className="study-pip-error">{error}</div>}
      <button className="study-pip-start" onClick={handleStart} disabled={starting}>
        {starting ? 'Starting…' : 'START'}
      </button>
    </div>
  )

  const session = activeSession
  const course = session?.courseName || session?.sourceName || session?.lessonTitle || courseName || 'Study Session'
  const lesson = session?.lessonNumber
    ? `Lesson No. ${session.lessonNumber}${session.lessonTitle ? ' · ' + session.lessonTitle : ''}`
    : session?.lessonTitle
      ? `Lesson: ${session.lessonTitle}`
      : lessonNo
        ? `Lesson No. ${lessonNo}`
        : 'Lesson: Not specified'

  const renderRunning = () => (
    <div className="study-pip-running">
      <div className="study-pip-meta">
        <div className="study-pip-course" title={course}>{course}</div>
        <div className="study-pip-lesson" title={lesson}>{lesson}</div>
        <div className="study-pip-badges">
          {session?.sourceName && <span className="study-pip-badge"><Globe size={11} /> {session.sourceName}</span>}
          {session?.educatorName && <span className="study-pip-badge edu"><GraduationCap size={11} /> {session.educatorName}</span>}
          {session?.courseName && <span className="study-pip-badge"><Layers size={11} /> {session.courseName}</span>}
        </div>
      </div>

      <div className="study-pip-timer">
        <span className={`study-pip-glyph ${isRunning ? 'active' : session && !completed ? 'paused' : 'idle'}`}>
          {completed ? '✓' : session ? (isRunning ? '●' : '●') : '●'}
        </span>
        <span className="study-pip-time">{formatHMS(session ? (typeof getElapsedSeconds === 'function' ? getElapsedSeconds() : 0) : 0)}</span>
        <span className={cn('study-pip-status', session && !completed && !isRunning ? 'paused' : completed ? 'done' : isRunning ? 'active' : 'idle')}>
          {completed ? 'COMPLETED' : isRunning ? '● Studying' : session ? '● Paused' : 'IDLE'}
        </span>
      </div>

      <div className="study-pip-controls">
        {!completed ? (
          <button className="study-pip-control primary" onClick={handlePauseResume} aria-label={isRunning ? 'Pause' : 'Resume'}>
            {isRunning ? <Pause size={18} /> : <Play size={18} />}
          </button>
        ) : (
          <button className="study-pip-control primary" onClick={() => studySessionController.replayContinue && studySessionController.replayContinue()} aria-label="Replay">
            <RotateCcw size={18} />
          </button>
        )}
        <button className="study-pip-control warn" onClick={handleReset} aria-label="Reset" title="Reset (discard)">
          <RotateCcw size={18} />
        </button>
        <button className="study-pip-control danger" onClick={handleStop} aria-label="Stop and Save" title="Stop and save">
          <Square size={15} />
        </button>
        <button className="study-pip-control" onClick={handleNewSession} aria-label="New Session" title="New Session">
          <Plus size={18} />
        </button>
      </div>

      <div className="study-pip-legend">
        <span>{completed ? 'COMPLETED' : isRunning ? 'pause' : session ? 'resume' : 'play'}</span>
        <span>stop</span>
        <span>reset</span>
        <span>restart</span>
      </div>

      <div className="study-pip-stats">
        <span>Today total study hours: <strong>{fmtToday(todaySeconds)}</strong></span>
        <span>Today sessions count: <strong>{todayCount}</strong></span>
      </div>

      <button className="study-pip-floating" onClick={handleOpenFloating}>
        <PictureInPicture2 size={14} /> open in floating timer
      </button>
    </div>
  )

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      closeOnOverlayClick={step === STATES.FORM}
      title="Study Session"
      size="sm"
      className="newsession-popup"
    >
      <div className="study-pip-body">
        {step === STATES.FORM ? renderForm() : renderRunning()}
      </div>
    </Modal>
  )
}

export default StudySessionPipModal
