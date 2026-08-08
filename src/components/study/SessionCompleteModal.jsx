import { useState, useEffect } from 'react'
import { CheckCircle2, RotateCcw, Trophy, Play } from 'lucide-react'
import { Modal } from '../Modal'
import { Button } from '../Button'
import { formatHMS } from '../../hooks/useSessionStore'
import { studySessionController } from '../../services/studySessionController'
import { useAuthStore } from '../../hooks/useStore'
import { StudyEntityService } from '../../services/StudyEntityService'

function formatLong(seconds) {
  const safe = Math.max(0, Math.floor(seconds || 0))
  const h = Math.floor(safe / 3600)
  const m = Math.floor((safe % 3600) / 60)
  const s = safe % 60
  const parts = []
  if (h > 0) parts.push(`${h}h`)
  if (m > 0 || h > 0) parts.push(`${m}m`)
  parts.push(`${s}s`)
  return parts.join(' ')
}

export function SessionCompleteModal({ open, session, onClose }) {
  const { user } = useAuthStore()
  const [progress, setProgress] = useState(session?.progressEnd ?? session?.completionPercent ?? 0)
  const [savingProgress, setSavingProgress] = useState(false)

  useEffect(() => {
    if (session) {
      setProgress(session.progressEnd ?? session.completionPercent ?? 0)
    }
  }, [session, open])

  if (!open || !session) return null

  const handleSaveProgress = async () => {
    if (!user) return
    setSavingProgress(true)
    try {
      if (session.lessonId && session.lessonId !== 'undefined') {
        const lesson = await StudyEntityService.updateLessonProgress(user.id, session.lessonId, progress)
        if (lesson) {
          session.progressEnd = progress
          session.completionPercent = Math.max(session.completionPercent || 0, progress)
        }
      } else {
        session.progressEnd = progress
        session.completionPercent = Math.max(session.completionPercent || 0, progress)
      }
    } finally {
      setSavingProgress(false)
    }
  }

  const handleContinue = () => {
    onClose()
    studySessionController.replayContinue()
  }

  const handleNewSession = () => {
    onClose()
    const started = studySessionController.startNew({
      sourceId: session.sourceId,
      sourceName: session.sourceName,
      sourceUrl: session.sourceUrl,
      domain: session.domain,
      courseId: session.courseId,
      courseName: session.courseName,
      educatorId: session.educatorId,
      educatorName: session.educatorName,
      lessonId: session.lessonId,
      lessonNumber: session.lessonNumber,
      lessonTitle: session.lessonTitle,
      topicId: session.topicId,
      topicName: session.topicName,
      contentType: session.contentType || 'video',
      progressStart: session.progressEnd ?? session.progressStart ?? 0,
    })
    window.dispatchEvent(new CustomEvent('study:session-started', { detail: started }))
  }

  return (
    <Modal open={open} onClose={onClose} title="Session Complete" maxWidth={480} className="session-complete-modal">
      <div className="session-complete-body">
        <div className="session-complete-icon"><Trophy size={28} /></div>
        <div className="session-complete-time">{formatHMS(session.elapsedSeconds)}</div>
        <div className="session-complete-sub">You studied {formatLong(session.elapsedSeconds)}</div>

        <div className="session-complete-meta">
          {session.sourceName && <div><span>Source</span><strong>{session.sourceName}</strong></div>}
          {session.courseName && <div><span>Course</span><strong>{session.courseName}</strong></div>}
          {session.educatorName && <div><span>Educator</span><strong>{session.educatorName}</strong></div>}
          {session.lessonTitle && <div><span>Lesson</span><strong>{session.lessonNumber ? `Lesson ${session.lessonNumber} — ` : ''}{session.lessonTitle}</strong></div>}
          {session.topicName && <div><span>Topic</span><strong>{session.topicName}</strong></div>}
        </div>

        <div className="session-complete-progress">
          <div className="session-complete-label">
            <span>Current Progress</span>
            <strong>{progress}%</strong>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            aria-label="Update lesson progress"
          />
          <div className="session-complete-progress-hint">
            <span>Study time and lesson progress are tracked separately.</span>
            {progress >= 100 && <span className="session-complete-done"><CheckCircle2 size={13} /> Lesson completed!</span>}
          </div>
        </div>

        <div className="session-complete-actions">
          <Button variant="ghost" onClick={onClose}>Done</Button>
          <Button variant="outline" onClick={handleContinue} disabled={!session}>
            <Play size={15} /> Continue Last Session
          </Button>
          <Button onClick={handleNewSession} disabled={savingProgress}>
            <RotateCcw size={15} /> Start Another Session
          </Button>
        </div>
        {savingProgress && <div className="session-complete-saving">Saving progress…</div>}
      </div>
    </Modal>
  )
}

export default SessionCompleteModal
