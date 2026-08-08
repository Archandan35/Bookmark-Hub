import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  BookmarkPlus, MoreHorizontal, Play, Plus,
  File, Clock, HardDrive, Calendar,
  BookOpen, FolderOpen, Lock, PanelLeftClose, ChevronRight,
} from 'lucide-react'
import { useAuthStore, useBookmarkStore } from '../hooks/useStore'
import { useSessionStore, formatHMS, VIDEO_STATE } from '../hooks/useSessionStore'
import { FileExplorer } from '../components/FileExplorer'
import { VideoPlayer } from '../components/VideoPlayer'
import { PausePrompt } from '../components/PausePrompt'
import { StartStudyModal } from '../components/study/StartStudyModal'
import { SessionCompleteModal } from '../components/study/SessionCompleteModal'
import { StudyTimerPanel } from '../components/study/StudyTimerPanel'
import { ActiveSessionRecovery } from '../components/study/ActiveSessionRecovery'
import { studySessionController } from '../services/studySessionController'
import { StudyService } from '../services/StudyService'

export function Learn() {
  const { user } = useAuthStore()
  const { bookmarks } = useBookmarkStore()
  const activeSession = useSessionStore((s) => s.activeSession)
  const videoState = useSessionStore((s) => s.videoState)
  const pausePromptOpen = useSessionStore((s) => s.pausePromptOpen)
  const rememberPauseChoice = useSessionStore((s) => s.rememberPauseChoice)
  const addSessions = useSessionStore((s) => s.addSessions)
  const getElapsedSeconds = useSessionStore((s) => s.getElapsedSeconds)
  const getSessionHistory = useSessionStore((s) => s.getSessionHistory)
  const getTodayStudySeconds = useSessionStore((s) => s.getTodayStudySeconds)
  const getWeeklyStudySeconds = useSessionStore((s) => s.getWeeklyStudySeconds)
  const getMonthlyStudySeconds = useSessionStore((s) => s.getMonthlyStudySeconds)
  useSessionStore((s) => s.now)
  const sessions = useSessionStore((s) => s.sessions)

  const videoRef = useRef(null)
  const fileExplorerRef = useRef(null)

  const [activeTab, setActiveTab] = useState('overview')
  const [duration, setDuration] = useState(0)
  const [folderPermission, setFolderPermission] = useState(null)
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const [videoFile, setVideoFile] = useState(null)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [showFileExplorer, setShowFileExplorer] = useState(true)
  const [showStartStudy, setShowStartStudy] = useState(false)
  const [completeModal, setCompleteModal] = useState(null)

  const objectUrlRef = useRef(null)

  useEffect(() => {
    studySessionController.setUser(user?.id || null)
  }, [user])

  useEffect(() => {
    if (!user) return
    let cancelled = false
    StudyService.getAll(user.id)
      .then((remote) => {
        if (!cancelled) addSessions(remote)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [user, addSessions])

  useEffect(() => {
    const orphan = useSessionStore.getState().activeSession
    if (orphan && !studySessionController.getVideo()) {
      studySessionController.recoverOrphanSession()
    }
  }, [])

  useEffect(() => {
    const handleBeforeUnload = () => {
      studySessionController.finalizeOnUnload()
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  // Show the completion modal when a study session finishes.
  useEffect(() => {
    const unsub = useSessionStore.subscribe((state, next) => {
      if (next.sessionPhase === 'completed' && state.sessionPhase !== 'completed') {
        setCompleteModal(next.lastCompletedSession)
      }
    })
    return unsub
  }, [])

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    }
  }, [])

  const requestFolderPermission = async () => {
    if (!('showDirectoryPicker' in window)) return
    try {
      const handle = await window.showDirectoryPicker({ mode: 'read' })
      setFolderPermission(handle)
      setShowPermissionModal(false)
    } catch (err) {
      if (err.name !== 'AbortError') console.error('Folder permission error:', err)
    }
  }

  const resetPermission = async () => {
    await studySessionController.unloadVideo()
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current)
      objectUrlRef.current = null
    }
    setFolderPermission(null)
    setVideoFile(null)
    setSelectedVideo(null)
    setDuration(0)
  }

  const handleBreadcrumbNavigate = useCallback((folderPath) => {
    if (fileExplorerRef.current) {
      fileExplorerRef.current.navigateToPath(folderPath)
    }
  }, [])

  const handleVideoSelect = useCallback(async (item) => {
    await studySessionController.unloadVideo()
    try {
      const file = await item.handle.getFile()
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
      const url = URL.createObjectURL(file)
      objectUrlRef.current = url
      setVideoFile({ url, name: item.name, size: file.size })
      setSelectedVideo(item)
      setDuration(0)
      studySessionController.setVideo({
        id: item.path || item.name,
        name: item.name,
        path: item.path,
        folder: folderPermission?.name || '',
      })
    } catch (err) {
      console.error('Error loading video:', err)
    }
  }, [folderPermission])

  const handleVideoPlay = useCallback(() => studySessionController.onVideoPlay(), [])
  const handleVideoPause = useCallback(() => studySessionController.onVideoPause(), [])
  const handleVideoEnded = useCallback(() => { studySessionController.stop({ completed: true }) }, [])
  const handleStop = useCallback(() => { studySessionController.stop() }, [])
  const handleReplay = useCallback(() => { studySessionController.replay() }, [])

  const handleTimeUpdate = useCallback(() => {
    studySessionController.syncProgress()
  }, [])

  const handleLoadedMetadata = useCallback((value) => {
    const next = typeof value === 'number' ? value : videoRef.current?.getDuration?.() || 0
    setDuration(next || 0)
  }, [])

  const resolvePause = useCallback((choice, remember) => {
    studySessionController.resolvePausePrompt(choice, remember)
  }, [])

  const elapsed = getElapsedSeconds()
  const todaySeconds = getTodayStudySeconds()
  const weeklySeconds = getWeeklyStudySeconds()
  const monthlySeconds = getMonthlyStudySeconds()
  const fullHistory = useMemo(() => getSessionHistory(), [getSessionHistory, sessions])
  const history = activeTab === 'history' ? fullHistory : fullHistory.slice(0, 5)
  const sessionCount = fullHistory.length
  const sessionStopped = videoState === VIDEO_STATE.STOPPED

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'history', label: `History (${sessionCount})` },
    { id: 'bookmarks', label: `Bookmarks (${bookmarks.length})` },
  ]

  const tags = useMemo(() => {
    const set = new Set()
    bookmarks.forEach((b) => (b.tags || []).forEach((t) => set.add(t)))
    return Array.from(set).slice(0, 8)
  }, [bookmarks])

  const iconFor = useCallback((type) => {
    if (type === 'video' || type === 'audio') return { icon: Play, iconBg: '#6D5CE1', iconColor: '#FFFFFF' }
    if (type === 'pdf') return { icon: File, iconBg: '#FEE2E2', iconColor: '#DC2626' }
    return { icon: BookOpen, iconBg: '#DBEAFE', iconColor: '#2563EB' }
  }, [])

  const resources = useMemo(() => bookmarks.slice(0, 4).map((b) => ({
    id: b.id,
    title: b.title,
    meta: b.type ? b.type.toUpperCase() : 'RESOURCE',
    ...iconFor(b.type),
  })), [bookmarks, iconFor])

  return (
    <div className="learn-page">
      <ActiveSessionRecovery />

      {showPermissionModal && (
        <div className="learn-permission-modal">
          <div className="learn-permission-content">
            <Lock size={48} />
            <h2>Folder Access Required</h2>
            <p>To play videos, please grant access to your video folder.</p>
            <div className="learn-permission-actions">
              <button className="learn-btn-primary" onClick={requestFolderPermission}>
                <FolderOpen size={16} />
                <span>Grant Access</span>
              </button>
              <button className="learn-btn-outline" onClick={() => setShowPermissionModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {pausePromptOpen && (
        <PausePrompt
          defaultRemember={rememberPauseChoice}
          onResolve={resolvePause}
        />
      )}

      <div className="learn-content">
        <div className="learn-header">
          <div className="learn-header-left">
            <h1 className="learn-title">{selectedVideo?.name || 'No video selected'}</h1>
            <div className="learn-breadcrumb file-explorer-breadcrumb-row">
              {selectedVideo?.path ? (
                selectedVideo.path.split('/').filter(Boolean).map((segment, i, arr) => (
                  <span key={`${segment}-${i}`} className="breadcrumb-item">
                    {i > 0 && <ChevronRight size={12} className="breadcrumb-sep" />}
                    <button
                      className={`breadcrumb-btn ${i === arr.length - 1 ? 'current' : ''}`}
                      onClick={() => {
                        if (i < arr.length -1) {
                          const folderPath = arr.slice(0, i + 1).join('/')
                          handleBreadcrumbNavigate(folderPath)
                        }
                      }}
                      title={segment}
                    >
                      {segment}
                    </button>
                  </span>
                ))
              ) : (
                <span className="breadcrumb-item">
                  <button className="breadcrumb-btn current">{folderPermission?.name || 'Select a video'}</button>
                </span>
              )}
            </div>
          </div>
          <div className="learn-header-actions">
            {folderPermission && (
              <button className="learn-btn-outline" onClick={resetPermission}>
                <Lock size={16} />
                <span>Reset</span>
              </button>
            )}
            {folderPermission && (
              <button
                className={"learn-btn-icon " + (showFileExplorer ? 'active' : '')}
                onClick={() => setShowFileExplorer(!showFileExplorer)}
                title={showFileExplorer ? 'Hide File Explorer' : 'Show File Explorer'}
              >
                <PanelLeftClose size={18} />
              </button>
            )}
          </div>
        </div>

        <div className="learn-main-layout">
          <div className="learn-video-wrapper">
            <div className="learn-video-card">
              <VideoPlayer
                ref={videoRef}
                src={videoFile?.url}
                title={selectedVideo?.name || 'No video selected'}
                folderName={folderPermission?.name || ''}
                studyTime={elapsed}
                activeSession={activeSession}
                sessionStopped={sessionStopped}
                onPlay={handleVideoPlay}
                onPause={handleVideoPause}
                onEnded={handleVideoEnded}
                onStop={handleStop}
                onReplay={handleReplay}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onRequestPermission={() => setShowPermissionModal(true)}
              />
            </div>
            {showFileExplorer && (
              <FileExplorer
                ref={fileExplorerRef}
                onVideoSelect={handleVideoSelect}
                currentVideo={videoFile}
                folderPermission={folderPermission}
                onRequestPermission={() => setShowPermissionModal(true)}
                showFileExplorer={showFileExplorer}
              />
            )}
          </div>
        </div>

        <div className="learn-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={"learn-tab " + (activeTab === tab.id ? 'active' : '')}
              onClick={() => setActiveTab(tab.id)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="learn-overview-panel">
            <div className="learn-cards-row">
              <div className="learn-card learn-about-card">
                <h3 className="learn-card-title">About this video</h3>
                <p className="learn-about-text">
                  {selectedVideo
                    ? `${selectedVideo.name} — played from ${folderPermission?.name || 'your local folder'}. Study time is tracked automatically while the video plays.`
                    : 'Select a video from your local folder to start a tracked study session.'}
                </p>
                <div className="learn-tags">
                  {tags.map((tag) => (
                    <span key={tag} className="learn-tag">{tag}</span>
                  ))}
                  <button className="learn-tag-add" type="button"><Plus size={14} /></button>
                </div>
              </div>
              <div className="learn-card learn-meta-card">
                <div className="learn-meta-row">
                  <div className="learn-meta-left">
                    <div className="learn-meta-icon"><File size={16} /></div>
                    <span className="learn-meta-label">Type</span>
                  </div>
                  <span className="learn-meta-value">
                    {selectedVideo?.name?.split('.').pop()?.toUpperCase() || '—'}
                  </span>
                </div>
                <div className="learn-meta-row">
                  <div className="learn-meta-left">
                    <div className="learn-meta-icon"><Clock size={16} /></div>
                    <span className="learn-meta-label">Duration</span>
                  </div>
                  <span className="learn-meta-value">{formatHMS(Math.floor(duration))}</span>
                </div>
                <div className="learn-meta-row">
                  <div className="learn-meta-left">
                    <div className="learn-meta-icon"><HardDrive size={16} /></div>
                    <span className="learn-meta-label">Size</span>
                  </div>
                  <span className="learn-meta-value">{videoFile ? (videoFile.size / 1024 / 1024).toFixed(1) + ' MB' : '—'}</span>
                </div>
                <div className="learn-meta-row">
                  <div className="learn-meta-left">
                    <div className="learn-meta-icon"><Calendar size={16} /></div>
                    <span className="learn-meta-label">Folder</span>
                  </div>
                  <span className="learn-meta-value">{folderPermission?.name || '—'}</span>
                </div>
              </div>
            </div>

            {history.length > 0 && (
              <div className="learn-card learn-history-card">
                <h3 className="learn-card-title">Session History</h3>
                <div className="learn-history-list">
                  {history.map((session) => (
                    <div key={session.id} className="learn-history-row">
                      <span className="learn-history-number">{'#' + (session.sessionNumber || 1)}</span>
                      <span className="learn-history-title">{session.videoName || session.videoTitle}</span>
                      <span className="learn-history-folder">{session.folderName || '—'}</span>
                      <span className="learn-history-duration">{session.durationFormatted}</span>
                      <span className="learn-history-completion">{session.completionPercent}%</span>
                      <span className="learn-history-date">{session.date}</span>
                      <span className="learn-history-time">{session.time}</span>
                    </div>
                  ))}
                </div>
                <div className="learn-history-stats">
                  <div className="learn-history-stat"><span>Today</span><span>{formatHMS(todaySeconds)}</span></div>
                  <div className="learn-history-stat"><span>This Week</span><span>{formatHMS(weeklySeconds)}</span></div>
                  <div className="learn-history-stat"><span>This Month</span><span>{formatHMS(monthlySeconds)}</span></div>
                </div>
              </div>
            )}

            <div className="learn-resources">
              <h3 className="learn-section-title">Resources in this session</h3>
              <div className="learn-resources-row">
                {resources.length === 0 && (
                  <span className="learn-resource-meta">No bookmarked resources yet</span>
                )}
                {resources.map((r) => (
                  <div key={r.id} className="learn-resource-card">
                    <div className="learn-resource-icon" style={{ backgroundColor: r.iconBg, color: r.iconColor }}>
                      <r.icon size={18} />
                    </div>
                    <span className="learn-resource-title">{r.title}</span>
                    <span className="learn-resource-meta">{r.meta}</span>
                  </div>
                ))}
                <div className="learn-resource-card learn-resource-add">
                  <Plus size={20} />
                  <span>Add More</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="learn-overview-panel">
            <div className="learn-card learn-history-card">
              <h3 className="learn-card-title">Session History</h3>
              {fullHistory.length === 0 ? (
                <span className="learn-resource-meta">No study sessions yet. Play a video to start tracking.</span>
              ) : (
                <div className="learn-history-list">
                  {fullHistory.map((session) => (
                    <div key={session.id} className="learn-history-row">
                      <span className="learn-history-number">{'#' + (session.sessionNumber || 1)}</span>
                      <span className="learn-history-title">{session.videoName || session.videoTitle}</span>
                      <span className="learn-history-folder">{session.folderName || '—'}</span>
                      <span className="learn-history-duration">{session.durationFormatted}</span>
                      <span className="learn-history-completion">{session.completionPercent}%</span>
                      <span className="learn-history-date">{session.date}</span>
                      <span className="learn-history-time">{session.time}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="learn-history-stats">
                <div className="learn-history-stat"><span>Today</span><span>{formatHMS(todaySeconds)}</span></div>
                <div className="learn-history-stat"><span>This Week</span><span>{formatHMS(weeklySeconds)}</span></div>
                <div className="learn-history-stat"><span>This Month</span><span>{formatHMS(monthlySeconds)}</span></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bookmarks' && (
          <div className="learn-overview-panel">
            <div className="learn-resources">
              <h3 className="learn-section-title">Bookmarked Resources</h3>
              <div className="learn-resources-row">
                {bookmarks.length === 0 && (
                  <span className="learn-resource-meta">No bookmarks yet</span>
                )}
                {bookmarks.map((b) => {
                  const icon = iconFor(b.type)
                  return (
                    <div key={b.id} className="learn-resource-card">
                      <div className="learn-resource-icon" style={{ backgroundColor: icon.iconBg, color: icon.iconColor }}>
                        <icon.icon size={18} />
                      </div>
                      <span className="learn-resource-title">{b.title}</span>
                      <span className="learn-resource-meta">{b.type ? b.type.toUpperCase() : 'RESOURCE'}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="learn-study-widget">
        <StudyTimerPanel onStartNew={() => setShowStartStudy(true)} />
        <button className="learn-btn-primary" onClick={() => setShowStartStudy(true)}>
          <BookOpen size={16} /> Start New Study Session
        </button>
      </div>

      <StartStudyModal
        open={showStartStudy}
        onClose={() => setShowStartStudy(false)}
        onStarted={() => {}}
        prefill={{
          title: selectedVideo?.name,
          url: selectedVideo?.path || '',
        }}
      />
      <SessionCompleteModal
        open={!!completeModal}
        session={completeModal}
        onClose={() => setCompleteModal(null)}
      />
    </div>
  )
}
