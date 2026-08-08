import { useState, useEffect, useRef } from 'react'
import { Play, Square, AlertTriangle } from 'lucide-react'
import { useSessionStore, formatHMS } from '../../hooks/useSessionStore'
import { studySessionController } from '../../services/studySessionController'
import { StudyService } from '../../services/StudyService'
import { useAuthStore } from '../../hooks/useStore'
import { Button } from '../Button'
import { useToast } from '../Toast'

/**
 * Recovery banner shown when a session is found after refresh, plus
 * multi-device protection: if Supabase reports a live session that is not
 * the one running locally, ask before proceeding.
 */
export function ActiveSessionRecovery() {
  const { user } = useAuthStore()
  const { addToast } = useToast()
  const activeSession = useSessionStore((s) => s.activeSession)
  const sessionPhase = useSessionStore((s) => s.sessionPhase)
  const getElapsedSeconds = useSessionStore((s) => s.getElapsedSeconds)
  const [elapsed, setElapsed] = useState(0)
  const [remoteConflict, setRemoteConflict] = useState(null)
  const checkedRef = useRef(false)

  useEffect(() => {
    const interval = setInterval(() => setElapsed(getElapsedSeconds()), 500)
    return () => clearInterval(interval)
  }, [getElapsedSeconds])

  useEffect(() => {
    if (!user || checkedRef.current) return
    checkedRef.current = true
    const localId = activeSession?.id || activeSession?.client_session_id || null
    studySessionController.checkActiveOnServer(user.id).then((remote) => {
      if (!remote) return
      if (localId && remote.client_session_id === localId) return
      setRemoteConflict(remote)
    })
  }, [user, activeSession?.id, activeSession?.client_session_id])

  if (!activeSession) return null

  const isRunning = activeSession.runningSince != null

  const handleContinueExisting = () => {
    // Adopt the server's session into this browser (paused, with its time).
    studySessionController.adoptRemoteSession(remoteConflict)
    setRemoteConflict(null)
    addToast('Session adopted from server', 'success')
  }

  const handleStopExistingAndStartNew = async () => {
    const remote = remoteConflict
    setRemoteConflict(null)
    // Record what the remote session accumulated as a completed entry, then
    // start a fresh local session.
    if (remote) {
      await StudyService.saveCompletedSession(user.id, {
        id: remote.client_session_id || remote.id,
        elapsedSeconds: remote.elapsed_seconds || remote.total_duration || 0,
        sourceId: remote.source_id,
        sourceName: remote.source_name,
        courseName: remote.course_name,
        educatorName: remote.educator_name,
        lessonTitle: remote.lesson_title,
        topicName: remote.topic_name,
        progressEnd: remote.progress_end,
      })
      addToast('Existing session recorded', 'success')
    }
  }

  return (
    <>
      <div className="active-session-recovery">
        <div className="active-session-recovery-inner">
          <div className="active-session-recovery-info">
            <span className="active-session-recovery-dot" />
            <div>
              <strong>Active Study Session Found</strong>
              <div className="active-session-recovery-meta">
                {[activeSession.sourceName, activeSession.courseName, activeSession.lessonTitle]
                  .filter(Boolean)
                  .join(' · ') || 'Study Session'}
              </div>
            </div>
            <div className="active-session-recovery-time">{formatHMS(elapsed)}</div>
          </div>
          <div className="active-session-recovery-actions">
            <Button size="sm" onClick={() => { studySessionController.resume(); addToast('Session resumed', 'success') }}>
              <Play size={14} /> Resume
            </Button>
            <Button size="sm" variant="danger" onClick={async () => { const r = await studySessionController.stopStudy(); addToast(r?.completed ? 'Session saved' : 'Session too short to record', r?.completed ? 'success' : 'info') }}>
              <Square size={13} /> Stop
            </Button>
          </div>
        </div>
      </div>

      {remoteConflict && (
        <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && setRemoteConflict(null)}>
          <div className="confirm-dialog">
            <div className="confirm-dialog-header">
              <span className="confirm-dialog-icon warn"><AlertTriangle size={18} /></span>
              <h3>Another study session is already active</h3>
              <button className="modal-close-btn" onClick={() => setRemoteConflict(null)} aria-label="Close dialog">✕</button>
            </div>
            <div className="confirm-dialog-body">
              <p>
                {remoteConflict.source_name || remoteConflict.bookmark_title || 'A session'}
                {remoteConflict.lesson_title ? ` · ${remoteConflict.lesson_title}` : ''}
              </p>
              <div className="confirm-dialog-current-time">
                <span>Recorded time</span>
                <strong>{formatHMS(remoteConflict.elapsed_seconds || remoteConflict.total_duration || 0)}</strong>
              </div>
              <p style={{ marginTop: 8 }}>This session was found on the server. It may still be running on another device.</p>
            </div>
            <div className="confirm-dialog-actions">
              <Button variant="outline" onClick={() => setRemoteConflict(null)}>Cancel</Button>
              <Button variant="primary" onClick={handleContinueExisting}>Continue Existing</Button>
              <Button variant="danger" onClick={handleStopExistingAndStartNew}>Stop &amp; Start New</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ActiveSessionRecovery
