import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import {
  BookmarkPlus, MoreHorizontal, Play, Plus,
  File, Clock, HardDrive, Calendar,
  BookOpen, FolderOpen, Lock, PanelLeftClose,
} from 'lucide-react'
import { useAuthStore, useBookmarkStore } from '../hooks/useStore'
import { useSessionStore } from '../hooks/useSessionStore'
import { FileExplorer } from '../components/FileExplorer'
import { VideoPlayer } from '../components/VideoPlayer'
import { formatDuration } from '../utils/helpers'

const MIN_SESSION_SECONDS = 5

export function Learn() {
  const { user } = useAuthStore()
  const { bookmarks } = useBookmarkStore()
  const {
    sessions,
    activeSession,
    startSession,
    updateSessionProgress,
    updateSession,
    pauseSession: storePauseSession,
    resumeSession: storeResumeSession,
    stopSession: storeStopSession,
    setSessions,
    totalStudySeconds,
    lastVideo,
    setRecoveryState,
    getTodayStudySeconds,
    getWeeklyStudySeconds,
    getMonthlyStudySeconds,
  } = useSessionStore()

  const videoRef = useRef(null)

  const [activeTab, setActiveTab] = useState('overview')
  const [playerState, setPlayerState] = useState('idle')
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [playbackSpeed, setPlaybackSpeed] = useState(1.25)
  const [folderPermission, setFolderPermission] = useState(null)
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const [videoFile, setVideoFile] = useState(null)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [showFileExplorer, setShowFileExplorer] = useState(true)
  const [elapsed, setElapsed] = useState(0)

  const timerRef = useRef(null)
  const elapsedRef = useRef(0)
  const playDebounceRef = useRef(false)
  const stopDebounceRef = useRef(false)
  const durationRef = useRef(0)
  const currentTimeRef = useRef(0)

  durationRef.current = duration
  currentTimeRef.current = currentTime

  const requestFolderPermission = async () => {
    if ('showDirectoryPicker' in window) {
      try {
        const handle = await window.showDirectoryPicker({ mode: 'read' })
        setFolderPermission(handle)
        setShowPermissionModal(false)
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Folder permission error:', err)
        }
      }
    }
  }

  const resetPermission = () => {
    localStorage.removeItem('folderPermissionHandle')
    setFolderPermission(null)
    setVideoFile(null)
    setSelectedVideo(null)
    handleStopSession()
  }

  useEffect(() => {
    if (user) {
      loadSessions()
    }
  }, [user])

  const loadSessions = useCallback(async () => {
    if (!user) return
    try {
      const data = await import('../services/StudyService')
      const studySessions = await data.StudyService.getAll(user.id)
      setSessions(studySessions)
    } catch (err) {
      console.error('Failed to load sessions:', err)
    }
  }, [user, setSessions])

  const handleVideoPlay = useCallback(() => {
    setPlayerState('playing')

    if (!activeSession) {
      startSession({
        id: selectedVideo?.name || null,
        title: selectedVideo?.name || 'Unknown Video',
        folder: folderPermission?.name || 'Unknown Folder',
      })
    } else if (activeSession.status === 'paused') {
      storeResumeSession()
    }
  }, [activeSession, selectedVideo, folderPermission, startSession, storeResumeSession])

  const handleVideoPause = useCallback(() => {
    setPlayerState('paused')
    if (activeSession) {
      storePauseSession()
    }
  }, [activeSession, storePauseSession])

  const handleStopSession = useCallback((autoSave = false) => {
    if (stopDebounceRef.current) return
    stopDebounceRef.current = true
    setTimeout(() => { stopDebounceRef.current = false }, 500)

    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }

    if (activeSession) {
      const completion = autoSave ? 100 : (duration > 0 ? Math.round((currentTime / duration) * 100) : 0)
      const totalElapsed = elapsedRef.current || (activeSession.elapsedSeconds || 0)

      updateSession({
        completionPercent: completion,
        elapsedSeconds: totalElapsed,
        duration: duration || 0,
      })

      storeStopSession()
      setRecoveryState(
        { id: activeSession.videoId, title: activeSession.videoTitle, folder: activeSession.folderName },
        0,
        0
      )
    }

    setElapsed(0)
    elapsedRef.current = 0
    setPlayerState('stopped')
  }, [activeSession, currentTime, duration, storeStopSession, updateSession, setRecoveryState])

  const handleVideoEnded = useCallback(() => {
    handleStopSession(true)
  }, [handleStopSession])

  const handleTimeUpdate = useCallback((time) => {
    setCurrentTime(time)
  }, [])

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration)
    }
  }, [])

  const handlePlay = useCallback(async () => {
    if (!videoRef.current || !selectedVideo) return

    if (playDebounceRef.current) return
    playDebounceRef.current = true
    setTimeout(() => { playDebounceRef.current = false }, 300)

    try {
      await videoRef.current.play()
    } catch (err) {
      console.error('Play failed:', err)
    }
  }, [selectedVideo])

  const handlePause = useCallback(() => {
    if (!videoRef.current) return
    videoRef.current.pause()
  }, [])

  const handleReplay = useCallback(async () => {
    if (!videoRef.current) return

    if (activeSession) {
      updateSession({
        completionPercent: 100,
        elapsedSeconds: elapsedRef.current || (activeSession.elapsedSeconds || 0),
        duration: duration,
      })
      storeStopSession()
    }

    setElapsed(0)
    elapsedRef.current = 0
    setCurrentTime(0)

    startSession({
      id: selectedVideo?.name || null,
      title: selectedVideo?.name || 'Unknown Video',
      folder: folderPermission?.name || 'Unknown Folder',
    })

    videoRef.current.currentTime = 0
    await videoRef.current.play()
    setPlayerState('playing')
  }, [activeSession, duration, selectedVideo, folderPermission, startSession, storeStopSession, updateSession])

  const handleVideoSelect = useCallback(async (item) => {
    if (activeSession) {
      updateSession({
        completionPercent: duration > 0 ? Math.round((currentTime / duration) * 100) : 0,
        elapsedSeconds: elapsedRef.current || (activeSession.elapsedSeconds || 0),
        duration: duration,
      })
      storeStopSession()
    }

    try {
      const file = await item.handle.getFile()
      const url = URL.createObjectURL(file)
      setVideoFile({ url, name: item.name, size: file.size })
      setSelectedVideo(item)
      setCurrentTime(0)
      setDuration(0)
      setElapsed(0)
      setPlayerState('ready')

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    } catch (err) {
      console.error('Error loading video:', err)
    }
  }, [activeSession, currentTime, duration, storeStopSession, updateSession])

  // Timer logic: track elapsed seconds while video is actively playing
  useEffect(() => {
    if (playerState !== 'playing') {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      return
    }

    if (!activeSession) return

    elapsedRef.current = activeSession.elapsedSeconds || 0

    timerRef.current = setInterval(() => {
      elapsedRef.current += 1
      setElapsed(elapsedRef.current)
      updateSessionProgress(
        elapsedRef.current,
        durationRef.current > 0 ? Math.round((currentTimeRef.current / durationRef.current) * 100) : 0
      )
    }, 1000)

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }, [playerState, activeSession?.status, updateSessionProgress])

  // Sync: clear elapsed state when session ends
  useEffect(() => {
    if (!activeSession && playerState !== 'idle' && playerState !== 'ready' && playerState !== 'stopped') {
      setPlayerState(selectedVideo ? 'ready' : 'idle')
    }
  }, [activeSession, playerState, selectedVideo])

  // Handle page unload: save session before refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (activeSession && activeSession.status === 'active' && elapsedRef.current >= MIN_SESSION_SECONDS) {
        updateSession({
completionPercent: duration > 0 ? (() => Math.round((currentTime / duration) * 100))() : 0,
          elapsedSeconds: elapsedRef.current,
          duration: duration,
          endTime: new Date().toISOString(),
          status: 'completed',
        })
        storeStopSession()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [activeSession, currentTime, duration, updateSession, storeStopSession])

  // Computed values
  const todaySeconds = getTodayStudySeconds()
  const weeklySeconds = getWeeklyStudySeconds()
  const monthlySeconds = getMonthlyStudySeconds()

  const displayElapsed = elapsed || (activeSession?.elapsedSeconds || 0)

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'notes', label: 'Notes' },
    { id: 'summary', label: 'Summary' },
    { id: 'bookmarks', label: 'Bookmarks (' + bookmarks.length + ')' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'resources', label: 'Resources' },
    { id: 'files', label: 'Files' },
    { id: 'chat', label: 'Chat (AI)' },
  ]

  const tags = ['React', 'Hooks', 'useState', 'useEffect', 'useContext']

  const resources = useMemo(() => [
    { id: 1, title: 'React Hooks Deep Dive', meta: 'Video - 856 MB', icon: Play, iconBg: '#6D5CE1', iconColor: '#FFFFFF' },
    { id: 2, title: 'Hooks Cheatsheet', meta: 'PDF - 2.4 MB', icon: File, iconBg: '#FEE2E2', iconColor: '#DC2626' },
    { id: 3, title: 'useEffect Explained', meta: 'Markdown - 12 KB', icon: BookOpen, iconBg: '#DBEAFE', iconColor: '#2563EB' },
    { id: 4, title: 'useState in Depth', meta: 'Video - 320 MB', icon: Play, iconBg: '#6D5CE1', iconColor: '#FFFFFF' },
  ], [])

  return (
    <div className="learn-page">
      {/* Permission Modal */}
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

      <div className="learn-content">
        {/* Header Row */}
        <div className="learn-header">
          <div className="learn-header-left">
            <h1 className="learn-title">{selectedVideo?.name || 'React Hooks Deep Dive'}</h1>
            <div className="learn-breadcrumb">
              <span className="breadcrumb-link">Development</span>
              <span className="breadcrumb-sep">\u203A</span>
              <span className="breadcrumb-link">React Course</span>
              <span className="breadcrumb-sep">\u203A</span>
              <span className="breadcrumb-current">Videos</span>
            </div>
          </div>
          <div className="learn-header-actions">
            {folderPermission && (
              <button className="learn-btn-outline" onClick={resetPermission}>
                <Lock size={16} />
                <span>Reset</span>
              </button>
            )}
            <button className="learn-btn-outline">
              <BookmarkPlus size={16} />
              <span>Add Bookmark</span>
            </button>
            {folderPermission && (
              <button
                className={"learn-btn-icon " + (showFileExplorer ? 'active' : '')}
                onClick={() => setShowFileExplorer(!showFileExplorer)}
                title={showFileExplorer ? 'Hide File Explorer' : 'Show File Explorer'}
              >
                <PanelLeftClose size={18} />
              </button>
            )}
            <button className="learn-btn-icon"><MoreHorizontal size={18} /></button>
          </div>
        </div>

        {/* Main Layout: Video + File Explorer */}
        <div className="learn-main-layout">
          {/* VLC-Style Video Player */}
          <div className="learn-video-wrapper">
            <div className="learn-video-card">
            <VideoPlayer
              ref={videoRef}
              src={videoFile?.url}
              title={selectedVideo?.name || 'React Hooks Deep Dive'}
              folderName={folderPermission?.name || ''}
              studyTime={displayElapsed}
              activeSession={activeSession}
              onPlay={handleVideoPlay}
              onPause={handleVideoPause}
              onEnded={handleVideoEnded}
              onStop={handleStopSession}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onRequestPermission={() => setShowPermissionModal(true)}
            />
            </div>
            {/* File Explorer Sidebar */}
            {showFileExplorer && (
              <FileExplorer
                onVideoSelect={handleVideoSelect}
                currentVideo={videoFile}
                folderPermission={folderPermission}
                onRequestPermission={() => setShowPermissionModal(true)}
                showFileExplorer={showFileExplorer}
              />
            )}
            </div>
          </div>

        {/* Tab Bar */}
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

        {/* Overview Tab Panel */}
        <div className="learn-overview-panel">
          <div className="learn-cards-row">
            <div className="learn-card learn-about-card">
              <h3 className="learn-card-title">About this video</h3>
              <p className="learn-about-text">
                In this session, we will dive deep into React Hooks, understanding how they work, the benefits they provide over class components, and how to use them effectively.
              </p>
              <div className="learn-tags">
                {tags.map((tag) => (
                  <span key={tag} className="learn-tag">{tag}</span>
                ))}
                <button className="learn-tag-add"><Plus size={14} /></button>
              </div>
            </div>
            <div className="learn-card learn-meta-card">
            <div className="learn-meta-row">
              <div className="learn-meta-left">
                <div className="learn-meta-icon"><File size={16} /></div>
                <span className="learn-meta-label">Type</span>
              </div>
              <span className="learn-meta-value">Video</span>
            </div>
            <div className="learn-meta-row">
              <div className="learn-meta-left">
                <div className="learn-meta-icon"><Clock size={16} /></div>
                <span className="learn-meta-label">Duration</span>
              </div>
              <span className="learn-meta-value">{formatDuration(Math.floor(duration)) || '01:22:45'}</span>
            </div>
            <div className="learn-meta-row">
              <div className="learn-meta-left">
                <div className="learn-meta-icon"><HardDrive size={16} /></div>
                <span className="learn-meta-label">Size</span>
              </div>
              <span className="learn-meta-value">{videoFile ? (videoFile.size / 1024 / 1024).toFixed(1) + ' MB' : '856 MB'}</span>
            </div>
            <div className="learn-meta-row">
              <div className="learn-meta-left">
                <div className="learn-meta-icon"><Calendar size={16} /></div>
                <span className="learn-meta-label">Added on</span>
              </div>
              <span className="learn-meta-value">May 10, 2024</span>
            </div>
          </div>
          </div>

          {/* Session History */}
          {sessions.length > 0 && (
            <div className="learn-card learn-history-card">
              <h3 className="learn-card-title">Session History</h3>
              <div className="learn-history-list">
                {sessions.slice(-5).reverse().map((session, idx) => (
                  <div key={session.id || session.sessionId || idx} className="learn-history-row">
                    <span className="learn-history-number">{'#' + (sessions.length - idx)}</span>
                    <span className="learn-history-title">{session.videoTitle || session.bookmark_title || 'Study Session'}</span>
                    <span className="learn-history-duration">{formatDuration(session.elapsedSeconds || session.total_duration || 0)}</span>
                    <span className="learn-history-completion">{session.completionPercent || session.completion_percent || 0}%</span>
                    <span className="learn-history-date">
                      {session.startTime || session.started_at
                        ? new Date(session.startTime || session.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : 'N/A'}
                    </span>
                  </div>
                ))}
              </div>
              <div className="learn-history-stats">
                <div className="learn-history-stat"><span>Today</span><span>{formatDuration(todaySeconds)}</span></div>
                <div className="learn-history-stat"><span>This Week</span><span>{formatDuration(weeklySeconds)}</span></div>
                <div className="learn-history-stat"><span>This Month</span><span>{formatDuration(monthlySeconds)}</span></div>
              </div>
            </div>
          )}

          {/* Resources Section */}
          <div className="learn-resources">
            <h3 className="learn-section-title">Resources in this session</h3>
            <div className="learn-resources-row">
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
      </div>
    </div>
  )
}