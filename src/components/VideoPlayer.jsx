import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react'
import {
  Play, Pause, Square, SkipBack, SkipForward, Volume2, VolumeX,
   Maximize, Minimize, PictureInPicture2, Info, X,
    Subtitles, MonitorPlay, RotateCcw, Volume1,
    Repeat, Maximize2, Camera, FolderOpen, Eye, EyeOff,
} from 'lucide-react'
import { playerBridge } from '../services/playerBridge'

const VideoPlayer = forwardRef(({
  src,
  title = 'Video',
  onPlay,
  onPause,
  onEnded,
  onStop,
  onReplay,
  onTimeUpdate,
  onLoadedMetadata,
  onRequestPermission,
  activeSession,
  sessionStopped = false,
  studyTime = 0,
  folderName = '',
}, ref) => {
  const videoRef = useRef(null)
  const containerRef = useRef(null)
  const hideTimerRef = useRef(null)
  const osdTimerRef = useRef(null)
  const audioContextRef = useRef(null)
  const gainNodeRef = useRef(null)
  const suppressPauseRef = useRef(false)
  const stopLockRef = useRef(false)
  const playLockRef = useRef(false)

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('videoVolume')
    return saved ? parseFloat(saved) : 1
  })
  const [isMuted, setIsMuted] = useState(false)
  const [lastVolume, setLastVolume] = useState(1)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)
  const [showCursor, setShowCursor] = useState(true)
  const [autoHideControls, setAutoHideControls] = useState(() => {
    const saved = localStorage.getItem('autoHideControls')
    return saved !== 'false'
  })
  const [buffered, setBuffered] = useState(0)
  const [isPiP, setIsPiP] = useState(false)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [showInfoPanel, setShowInfoPanel] = useState(false)
  const [showContextMenu, setShowContextMenu] = useState(null)
  const [isLooping, setIsLooping] = useState(false)
  const [aspectRatio, setAspectRatio] = useState('default')
  const [zoomLevel, setZoomLevel] = useState(100)
  const [showAspectMenu, setShowAspectMenu] = useState(false)
  const [subtitleEnabled, setSubtitleEnabled] = useState(false)
  const [subtitleDelay, setSubtitleDelay] = useState(0)
  const [subtitleFontSize, setSubtitleFontSize] = useState(16)
  const [subtitleColor, setSubtitleColor] = useState('#FFFFFF')
  const [subtitleBgColor, setSubtitleBgColor] = useState('#000000')
  const [subtitleTrack, setSubtitleTrack] = useState(null)
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false)
  const [chapters, setChapters] = useState([])
  const [bookmarks, setBookmarks] = useState([])
  const [osdMessage, setOsdMessage] = useState(null)
  const [hoverTime, setHoverTime] = useState(null)
  const [hoverPosition, setHoverPosition] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isSeeking, setIsSeeking] = useState(false)

  const speeds = [0.5, 0.75, 1, 1.25, 1.35, 1.5, 2]
  const [customSpeed, setCustomSpeed] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = Math.floor(seconds % 60)
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const showOSD = useCallback((message) => {
    setOsdMessage(message)
    clearTimeout(osdTimerRef.current)
    osdTimerRef.current = setTimeout(() => setOsdMessage(null), 2000)
  }, [])

  const resetHideTimer = useCallback(() => {
    setShowControls(true)
    setShowCursor(true)
    clearTimeout(hideTimerRef.current)
    if (autoHideControls && isPlaying) {
      hideTimerRef.current = setTimeout(() => {
        setShowControls(false)
        setShowCursor(false)
      }, 10000)
    }
  }, [autoHideControls, isPlaying])

  const toggleAutoHide = useCallback(() => {
    setAutoHideControls(prev => {
      const next = !prev
      localStorage.setItem('autoHideControls', next.toString())
      return next
    })
  }, [])

  const adjustVolume = useCallback((delta) => {
    const v = Math.max(0, Math.min(2, volume + delta)); setVolume(v); setIsMuted(false); showOSD(`Volume ${Math.round(v * 100)}%`)
  }, [volume, showOSD])

  useEffect(() => {
    localStorage.setItem('videoVolume', volume.toString())
  }, [volume])

  // Native wheel handler with passive:false to prevent page scroll over player
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const onWheel = (e) => {
      e.preventDefault()
      adjustVolume(e.deltaY > 0 ? -0.05 : 0.05)
    }
    container.addEventListener('wheel', onWheel, { passive: false })
    return () => container.removeEventListener('wheel', onWheel)
  }, [adjustVolume])

  // Stable event handlers using refs to avoid stale closures
  const isSeekingRef = useRef(isSeeking)
  isSeekingRef.current = isSeeking
  const onPlayRef = useRef(onPlay)
  onPlayRef.current = onPlay
  const onPauseRef = useRef(onPause)
  onPauseRef.current = onPause
  const onEndedRef = useRef(onEnded)
  onEndedRef.current = onEnded
  const onTimeUpdateRef = useRef(onTimeUpdate)
  onTimeUpdateRef.current = onTimeUpdate
  const onLoadedMetadataRef = useRef(onLoadedMetadata)
  onLoadedMetadataRef.current = onLoadedMetadata

  // Video event handlers - runs once on mount
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const handleTimeUpdate = () => { if (!isSeekingRef.current) { setCurrentTime(video.currentTime); onTimeUpdateRef.current?.(video.currentTime) } }
    const handleLoadedMetadata = () => { setDuration(video.duration); onLoadedMetadataRef.current?.(video.duration) }
    const onProgress = () => { if (video.buffered.length > 0) setBuffered(video.buffered.end(video.buffered.length - 1)) }
    const onPlayEvt = () => { setIsPlaying(true); suppressPauseRef.current = false; onPlayRef.current?.() }
    const onPauseEvt = () => {
      setIsPlaying(false)
      if (suppressPauseRef.current) {
        suppressPauseRef.current = false
        return
      }
      if (video.ended) return
      onPauseRef.current?.()
    }
    const onEndedEvt = () => { setIsPlaying(false); suppressPauseRef.current = true; onEndedRef.current?.() }
    const onVol = () => { setVolume(video.volume); setIsMuted(video.muted) }
    const onPiPEnter = () => setIsPiP(true)
    const onPiPLeave = () => setIsPiP(false)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('progress', onProgress)
    video.addEventListener('play', onPlayEvt)
    video.addEventListener('pause', onPauseEvt)
    video.addEventListener('ended', onEndedEvt)
    video.addEventListener('volumechange', onVol)
    video.addEventListener('enterpictureinpicture', onPiPEnter)
    video.addEventListener('leavepictureinpicture', onPiPLeave)
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('progress', onProgress)
      video.removeEventListener('play', onPlayEvt)
      video.removeEventListener('pause', onPauseEvt)
      video.removeEventListener('ended', onEndedEvt)
      video.removeEventListener('volumechange', onVol)
      video.removeEventListener('enterpictureinpicture', onPiPEnter)
      video.removeEventListener('leavepictureinpicture', onPiPLeave)
    }
  }, [src])

  // Reload video when src changes
  useEffect(() => {
    const video = videoRef.current
    if (!video || !src) return
    setCurrentTime(0)
    setDuration(0)
    setBuffered(0)
    setIsPlaying(false)
    video.load()
  }, [src])

  const controlsRef = useRef(null)
  controlsRef.current = {
    play: () => videoRef.current?.play()?.catch(() => {}),
    pause: () => { videoRef.current?.pause() },
    pauseSilently: () => {
      if (!videoRef.current) return
      suppressPauseRef.current = true
      videoRef.current.pause()
    },
    stop: () => {
      if (!videoRef.current) return
      suppressPauseRef.current = true
      videoRef.current.pause()
      videoRef.current.currentTime = 0
      setCurrentTime(0)
    },
    replay: () => {
      if (!videoRef.current) return undefined
      videoRef.current.currentTime = 0
      setCurrentTime(0)
      return videoRef.current.play()?.catch(() => {})
    },
    getVideoElement: () => videoRef.current,
    getCurrentTime: () => videoRef.current?.currentTime || 0,
    getDuration: () => videoRef.current?.duration || 0,
    isPlaying: () => isPlaying,
  }

  useImperativeHandle(ref, () => controlsRef.current, [])

  useEffect(() => {
    return playerBridge.register({
      play: () => controlsRef.current.play(),
      pause: () => controlsRef.current.pause(),
      pauseSilently: () => controlsRef.current.pauseSilently(),
      stop: () => controlsRef.current.stop(),
      replay: () => controlsRef.current.replay(),
      getCurrentTime: () => controlsRef.current.getCurrentTime(),
      getDuration: () => controlsRef.current.getDuration(),
    })
  }, [])

  // Apply volume with Web Audio API for >100% support
  const applyVolume = useCallback((videoElement, vol, muted) => {
    if (muted || vol === 0) {
      videoElement.volume = 0
      return
    }
    if (vol <= 1) {
      videoElement.volume = vol
    } else {
      videoElement.volume = 1
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)()
          const source = audioContextRef.current.createMediaElementSource(videoElement)
          gainNodeRef.current = audioContextRef.current.createGain()
          source.connect(gainNodeRef.current)
          gainNodeRef.current.connect(audioContextRef.current.destination)
        }
        if (gainNodeRef.current) {
          gainNodeRef.current.gain.value = vol
        }
      } catch {
        videoElement.volume = 1
      }
    }
  }, [])

  useEffect(() => {
    if (videoRef.current) applyVolume(videoRef.current, volume, isMuted)
  }, [volume, isMuted, applyVolume])

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = playbackSpeed
  }, [playbackSpeed])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimeout(hideTimerRef.current)
      clearTimeout(osdTimerRef.current)
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {})
        audioContextRef.current = null
      }
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      switch (e.key) {
        case ' ': case 'k': case 'K':
          e.preventDefault(); isPlaying ? handlePause() : handlePlay(); break
        case 'j': case 'J':
          e.preventDefault(); skipBackward(); break
        case 'l': case 'L':
          e.preventDefault(); skipForward(); break
        case 'ArrowLeft':
          e.preventDefault(); skipSeconds(-5); break
        case 'ArrowRight':
          e.preventDefault(); skipSeconds(5); break
        case 'ArrowUp':
          e.preventDefault(); adjustVolume(0.05); break
        case 'ArrowDown':
          e.preventDefault(); adjustVolume(-0.05); break
        case 'm': case 'M':
          e.preventDefault(); toggleMute(); break
        case 'f': case 'F':
          e.preventDefault(); toggleFullscreen(); break
        case 'Escape':
          if (isFullscreen) { e.preventDefault(); exitFullscreen() }; break
        case 'p': case 'P':
          e.preventDefault(); togglePiP(); break
        case 's': case 'S':
          e.preventDefault(); handleStop(); break
        case 'r': case 'R':
          e.preventDefault(); handleReplay(); break
        case 'c': case 'C':
          e.preventDefault(); showOSD('Captions toggled'); break
        case '+':
          e.preventDefault(); cycleSpeed(1); break
        case '-':
          e.preventDefault(); cycleSpeed(-1); break
        case '0':
          e.preventDefault(); setPlaybackSpeed(1); showOSD('Speed: 1x'); break
        case 'Home':
          e.preventDefault(); seekTo(0); break
        case 'End':
          e.preventDefault(); if (duration) seekTo(duration); break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPlaying, isFullscreen, duration, playbackSpeed, volume, isMuted])

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const handlePlay = useCallback(() => {
    if (playLockRef.current) return
    playLockRef.current = true
    setTimeout(() => { playLockRef.current = false }, 300)
    if (videoRef.current) {
      videoRef.current.play().then(() => {
        setIsPlaying(true)
      }).catch(() => {})
    }
  }, [])

  const handlePause = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause()
      setIsPlaying(false)
    }
  }, [])

  const handleStop = useCallback(() => {
    if (stopLockRef.current) return
    stopLockRef.current = true
    setTimeout(() => { stopLockRef.current = false }, 500)
    setIsPlaying(false)
    showOSD('Stopped')
    controlsRef.current.stop()
    onStop?.()
  }, [showOSD, onStop])

  const handleReplay = useCallback(() => {
    showOSD('Replay Started')
    controlsRef.current.replay()
    onReplay?.()
  }, [showOSD, onReplay])

  const skipForward = useCallback(() => {
    if (videoRef.current) {
      const newTime = Math.min(videoRef.current.currentTime + 10, duration || videoRef.current.duration || 0)
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }, [duration])

  const skipBackward = useCallback(() => {
    if (videoRef.current) {
      const newTime = Math.max(videoRef.current.currentTime - 10, 0)
      videoRef.current.currentTime = newTime
      setCurrentTime(newTime)
    }
  }, [])

  const skipSeconds = useCallback((sec) => {
    if (videoRef.current) videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.currentTime + sec, duration))
  }, [duration])

  const seekTo = useCallback((time) => {
    if (videoRef.current) { videoRef.current.currentTime = time; setCurrentTime(time) }
  }, [])
  const handleSeekStart = useCallback((e) => {
    setIsSeeking(true); setIsDragging(true)
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    seekTo(pct * duration)
  }, [duration, seekTo])

  const handleSeekMove = useCallback((e) => {
    if (!isDragging) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    setHoverTime(pct * duration); setHoverPosition(pct * 100); seekTo(pct * duration)
  }, [isDragging, duration, seekTo])

  const handleSeekEnd = useCallback(() => { setIsDragging(false); setIsSeeking(false) }, [])

  const handleSeekHover = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    setHoverTime(pct * duration); setHoverPosition(pct * 100)
  }, [duration])

  const toggleMute = useCallback(() => {
    if (isMuted) {
      setVolume(lastVolume > 0 ? lastVolume : 1)
      setIsMuted(false)
      showOSD(`Volume ${Math.round((lastVolume > 0 ? lastVolume : 1) * 100)}%`)
    } else {
      setLastVolume(volume)
      setIsMuted(true)
      showOSD('Muted')
    }
  }, [isMuted, lastVolume, volume, showOSD])

  const handleVolumeChange = useCallback((e) => {
    const v = parseFloat(e.target.value); setVolume(v); setIsMuted(v === 0)
  }, [])



  const cycleSpeed = useCallback((dir) => {
    const idx = speeds.indexOf(playbackSpeed)
    let ni
    if (idx === -1) {
      // Custom speed: find closest preset
      const sorted = speeds.map((s, i) => ({ s, i, d: Math.abs(s - playbackSpeed) })).sort((a, b) => a.d - b.d)
      const closestIdx = sorted[0].i
      ni = dir > 0 ? Math.min(speeds.length - 1, closestIdx + 1) : Math.max(0, closestIdx - 1)
    } else {
      ni = Math.max(0, Math.min(speeds.length - 1, idx + dir))
    }
    setPlaybackSpeed(speeds[ni]); showOSD(`Speed: ${speeds[ni]}x`)
  }, [playbackSpeed, speeds, showOSD])

  const applyCustomSpeed = useCallback((val) => {
    const num = parseFloat(val)
    if (!isNaN(num) && num >= 0.1 && num <= 4) {
      setPlaybackSpeed(num)
      setShowCustomInput(false)
      setShowSpeedMenu(false)
      showOSD(`Speed: ${num}x`)
    }
  }, [showOSD])

  const adjustCustomSpeed = useCallback((delta) => {
    const next = Math.max(0.1, Math.min(4, +(playbackSpeed + delta).toFixed(2)))
    setPlaybackSpeed(next)
    setCustomSpeed(next.toString())
    showOSD(`Speed: ${next}x`)
  }, [playbackSpeed, showOSD])

  const enterFullscreen = useCallback(async () => {
    try { await containerRef.current?.requestFullscreen(); setIsFullscreen(true); showOSD('Fullscreen') }
    catch (err) { console.error('Fullscreen error:', err) }
  }, [showOSD])

  const exitFullscreen = useCallback(async () => {
    try { await document.exitFullscreen(); setIsFullscreen(false); showOSD('Exit Fullscreen') }
    catch (err) { console.error('Exit FS error:', err) }
  }, [showOSD])

  const toggleFullscreen = useCallback(() => { isFullscreen ? exitFullscreen() : enterFullscreen() }, [isFullscreen, enterFullscreen, exitFullscreen])

  const togglePiP = useCallback(async () => {
    try {
      if (document.pictureInPictureElement) await document.exitPictureInPicture()
      else if (videoRef.current) await videoRef.current.requestPictureInPicture()
      showOSD('Picture in Picture')
    } catch (err) { console.error('PiP error:', err) }
  }, [showOSD])

  const handleContextMenu = useCallback((e) => { e.preventDefault(); setShowContextMenu({ x: e.clientX, y: e.clientY }) }, [])
  const closeContextMenu = useCallback(() => setShowContextMenu(null), [])

  // Loop toggle
  const toggleLoop = useCallback(() => {
    setIsLooping(prev => {
      const next = !prev
      if (videoRef.current) videoRef.current.loop = next
      showOSD(next ? 'Loop Enabled' : 'Loop Disabled')
      return next
    })
  }, [showOSD])

  // Aspect ratio
  const handleAspectChange = useCallback((ratio) => {
    setAspectRatio(ratio)
    setShowAspectMenu(false)
    showOSD(`Aspect Ratio: ${ratio}`)
    if (videoRef.current) {
      videoRef.current.style.aspectRatio = ''
      videoRef.current.style.objectFit = ''
      videoRef.current.style.width = ''
      videoRef.current.style.height = ''
    }
  }, [showOSD])

  const getAspectStyle = useCallback(() => {
    const ratioMap = {
      'default': { objectFit: 'contain', aspectRatio: 'auto' },
      '16:9': { aspectRatio: '16/9', objectFit: 'cover' },
      '4:3': { aspectRatio: '4/3', objectFit: 'cover' },
      '21:9': { aspectRatio: '21/9', objectFit: 'cover' },
      '1:1': { aspectRatio: '1/1', objectFit: 'cover' },
    }
    return ratioMap[aspectRatio] || { objectFit: 'contain' }
  }, [aspectRatio])

  // Zoom
  const handleZoom = useCallback((delta) => {
    setZoomLevel(prev => {
      const next = Math.max(50, Math.min(200, prev + delta))
      showOSD(`Zoom: ${next}%`)
      return next
    })
  }, [showOSD])

  // Screenshot
  const handleScreenshot = useCallback(() => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0)
    const link = document.createElement('a')
    link.download = `screenshot-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    showOSD('Screenshot Saved')
  }, [showOSD])

  // Frame-by-frame (advance 1 frame ≈ 1/30s)
  const frameStep = useCallback((direction) => {
    if (videoRef.current) {
      const frameTime = 1 / 30
      videoRef.current.currentTime = Math.max(0, Math.min(
        videoRef.current.currentTime + (direction * frameTime),
        duration
      ))
      showOSD(`Frame ${direction > 0 ? '+' : '-'}1`)
    }
  }, [duration, showOSD])

  // Subtitle controls
  const toggleSubtitles = useCallback(() => {
    setSubtitleEnabled(prev => {
      const next = !prev
      showOSD(next ? 'Subtitles On' : 'Subtitles Off')
      return next
    })
  }, [showOSD])

  const handleSubtitleDelay = useCallback((delta) => {
    setSubtitleDelay(prev => {
      const next = prev + delta
      showOSD(`Subtitle Delay: ${next > 0 ? '+' : ''}${next / 1000}s`)
      return next
    })
  }, [showOSD])

  const handleSubtitleSizeChange = useCallback((delta) => {
    setSubtitleFontSize(prev => Math.max(12, Math.min(32, prev + delta)))
  }, [])

  const handleSubtitleColorChange = useCallback((color) => {
    setSubtitleColor(color)
    setSubtitleBgColor(color === '#FFFFFF' ? '#000000' : '#FFFFFF')
  }, [])

  // Add bookmark at current position
  const addBookmark = useCallback(() => {
    const newBookmark = { time: currentTime, label: `Bookmark ${bookmarks.length + 1}` }
    setBookmarks(prev => [...prev, newBookmark])
    showOSD('Bookmark Added')
  }, [currentTime, bookmarks.length, showOSD])

  // Remove bookmark
  const removeBookmark = useCallback((time) => {
    setBookmarks(prev => prev.filter(b => b.time !== time))
    showOSD('Bookmark Removed')
  }, [showOSD])

  // Go to chapter/bookmark
  const goToMarker = useCallback((time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      setCurrentTime(time)
    }
  }, [])

  const remainingTime = duration - currentTime
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0
  const bufferedPercent = duration > 0 ? (buffered / duration) * 100 : 0
  const completionPercent = duration > 0 ? Math.round((currentTime / duration) * 1000) / 10 : 0

  const handleMouseMove = useCallback(() => resetHideTimer(), [resetHideTimer])
  if (!src) {
    return (
      <div className="vlc-player empty">
        <div className="vlc-empty-state">
          <MonitorPlay size={64} />
          <h3>No Video Selected</h3>
          <p>Choose a folder to browse and play videos</p>
          <button className="vlc-choose-folder-btn" onClick={onRequestPermission}>
            <FolderOpen size={18} />
            <span>Choose Folder</span>
          </button>
          <span className="vlc-empty-hint">Supports MP4, WebM, MKV, MOV, AVI, TS</span>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`vlc-player ${isFullscreen ? 'fullscreen' : ''} ${!showControls ? 'hide-controls' : ''} ${!showCursor ? 'hide-cursor' : ''}`}
      onMouseMove={handleMouseMove}
      onContextMenu={handleContextMenu}
      onClick={closeContextMenu}
    >
      <video
        ref={videoRef}
        src={src}
        className={`vlc-video ${aspectRatio !== 'default' ? 'vlc-video-aspect' : ''}`}
        style={aspectRatio !== 'default' ? getAspectStyle() : {}}
        onClick={isPlaying ? handlePause : handlePlay}
        onDoubleClick={toggleFullscreen}
        preload="auto"
      />

      {/* OSD Message */}
      {osdMessage && <div className="vlc-osd">{osdMessage}</div>}

      {/* Top Overlay */}
      <div className="vlc-top-overlay">
        <div className="vlc-top-left">
          <span className="vlc-video-title">{title}</span>
        </div>
        <div className="vlc-top-right">
          <button className="vlc-icon-btn" onClick={() => setShowInfoPanel(true)} title="Info"><Info size={16} /></button>
          <button className="vlc-icon-btn" onClick={togglePiP} title="Picture in Picture"><PictureInPicture2 size={16} /></button>
          <div className="vlc-speed-badge-container">
            <button className="vlc-speed-badge" onClick={() => setShowSpeedMenu(!showSpeedMenu)} title="Playback Speed">
              {playbackSpeed}×
            </button>
          </div>
          {!isFullscreen && (
            <button className={`vlc-icon-btn ${subtitleEnabled ? 'active' : ''}`} onClick={() => setShowSubtitleMenu(!showSubtitleMenu)} title="Subtitles (C)">
              <Subtitles size={16} />
            </button>
          )}
          <button className="vlc-icon-btn vlc-close" onClick={handleStop} title="Close"><X size={16} /></button>
        </div>
      </div>

      {/* Bottom Overlay */}
      <div className="vlc-bottom-overlay">
        {/* Seek Bar */}
          <div className="vlc-seek-container" onMouseDown={handleSeekStart} onMouseMove={isDragging ? handleSeekMove : handleSeekHover} onMouseUp={handleSeekEnd} onMouseLeave={handleSeekEnd}>
          <div className="vlc-seek-track">
            <div className="vlc-seek-buffered" style={{ width: `${bufferedPercent}%` }} />
            <div className="vlc-seek-progress" style={{ width: `${progressPercent}%` }} />
          </div>
          {hoverTime !== null && (
            <div className="vlc-seek-tooltip" style={{ left: `${hoverPosition}%` }}>{formatTime(hoverTime)}</div>
          )}
        </div>

        {/* Controls */}
        <div className="vlc-controls">
          <div className="vlc-controls-left">
            <button className="vlc-icon-btn" onClick={skipBackward} title="Previous (J)"><SkipBack size={18} /></button>
            <button className="vlc-icon-btn vlc-play-btn" onClick={isPlaying ? handlePause : handlePlay} title="Play/Pause (Space)">
              {isPlaying ? <Pause size={22} /> : <Play size={22} />}
            </button>
            <button className="vlc-icon-btn" onClick={skipForward} title="Next (L)"><SkipForward size={18} /></button>
            {sessionStopped && !activeSession ? (
              <button className="vlc-icon-btn" onClick={handleReplay} title="Replay (R)"><RotateCcw size={18} /></button>
            ) : (
              <button className="vlc-icon-btn" onClick={handleStop} disabled={!activeSession} title="Stop (S)"><Square size={18} /></button>
            )}
            <span className="vlc-time">{formatTime(currentTime)} <span className="vlc-time-sep">/</span> {formatTime(duration)}</span>
          </div>
          <div className="vlc-controls-right">
            <button
              className={`vlc-icon-btn ${autoHideControls ? 'active' : ''}`}
              onClick={toggleAutoHide}
              title={autoHideControls ? 'Auto-hide controls ON (click to disable)' : 'Auto-hide controls OFF (click to enable)'}
            >
              {autoHideControls ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
            <button className={`vlc-icon-btn ${isLooping ? 'active' : ''}`} onClick={toggleLoop} title="Loop">
              <Repeat size={16} />
            </button>
            <div className="vlc-speed-badge-container">
              <button className="vlc-speed-badge" onClick={() => setShowSpeedMenu(!showSpeedMenu)} title="Playback Speed">
                {playbackSpeed}×
              </button>
            </div>
            <div className="vlc-volume-container">
              <button className="vlc-icon-btn" onClick={toggleMute} title="Mute (M)">
                {isMuted || volume === 0 ? <VolumeX size={18} /> : volume < 0.5 ? <Volume1 size={18} /> : <Volume2 size={18} />}
              </button>
              <div className="vlc-volume-slider-wrapper">
                <div className="vlc-volume-track">
                  <div className="vlc-volume-fill" style={{ width: `${(isMuted ? 0 : volume) / 2 * 100}%` }} />
                  <input
                    type="range"
                    className="vlc-volume-slider"
                    min="0"
                    max="2"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                  />
                </div>
                <span className="vlc-volume-percent">{Math.round((isMuted ? 0 : volume) * 100)}%</span>
              </div>
            </div>
            <button className="vlc-icon-btn" onClick={handleScreenshot} title="Screenshot"><Camera size={16} /></button>
            <div className="vlc-menu-container">
              <button className="vlc-icon-btn" onClick={() => setShowAspectMenu(!showAspectMenu)} title="Aspect Ratio"><Maximize2 size={16} /></button>
              {showAspectMenu && (
                <div className="vlc-speed-menu" onClick={e => e.stopPropagation()}>
                  {['default', '16:9', '4:3', '21:9', '1:1'].map(r => (
                    <button key={r} className={`vlc-speed-item ${aspectRatio === r ? 'active' : ''}`} onClick={() => handleAspectChange(r)}>{r}</button>
                  ))}
                </div>
              )}
            </div>
             {isFullscreen && (
               <button className={`vlc-icon-btn ${subtitleEnabled ? 'active' : ''}`} onClick={() => setShowSubtitleMenu(!showSubtitleMenu)} title="Subtitles (C)">
                 <Subtitles size={16} />
               </button>
             )}
             <button className="vlc-icon-btn" onClick={toggleFullscreen} title="Fullscreen (F)">
              {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Subtitle Menu */}
      {showSubtitleMenu && (
        <div className="vlc-speed-menu subtitle-menu" onClick={e => e.stopPropagation()}>
          <button className={`vlc-speed-item ${subtitleEnabled ? 'active' : ''}`} onClick={toggleSubtitles}>
            {subtitleEnabled ? 'Disable Subtitles' : 'Enable Subtitles'}
          </button>
          <button className="vlc-speed-item" onClick={() => handleSubtitleDelay(-100)}>Delay -0.1s</button>
          <button className="vlc-speed-item" onClick={() => handleSubtitleDelay(100)}>Delay +0.1s</button>
          <button className="vlc-speed-item" onClick={() => handleSubtitleSizeChange(-2)}>Font Smaller</button>
          <button className="vlc-speed-item" onClick={() => handleSubtitleSizeChange(2)}>Font Larger</button>
          <button className="vlc-speed-item" onClick={addBookmark}>Add Bookmark</button>
        </div>
      )}

      {/* Speed Menu */}
      {showSpeedMenu && (
        <div className="vlc-speed-menu" onClick={e => e.stopPropagation()}>
          {speeds.map(s => (
            <button key={s} className={`vlc-speed-item ${s === playbackSpeed && !showCustomInput ? 'active' : ''}`} onClick={() => { setPlaybackSpeed(s); setShowCustomInput(false); setShowSpeedMenu(false); showOSD(`Speed: ${s}x`) }}>
              {s}×
            </button>
          ))}
          <div className="vlc-speed-separator" />
          <button className={`vlc-speed-item ${showCustomInput ? 'active' : ''}`} onClick={() => { setShowCustomInput(!showCustomInput); setCustomSpeed(playbackSpeed.toString()) }}>
            Custom Speed
          </button>
          {showCustomInput && (
            <div className="vlc-custom-speed">
              <button className="vlc-speed-adjust" onClick={() => adjustCustomSpeed(-0.05)}>−</button>
              <input
                type="number"
                className="vlc-speed-input"
                min="0.1"
                max="4"
                step="0.05"
                value={customSpeed}
                onChange={e => { setCustomSpeed(e.target.value); applyCustomSpeed(e.target.value) }}
                onKeyDown={e => { if (e.key === 'Enter') applyCustomSpeed(customSpeed) }}
                placeholder="1.0"
                autoFocus
              />
              <button className="vlc-speed-adjust" onClick={() => adjustCustomSpeed(0.05)}>+</button>
            </div>
          )}
        </div>
      )}

      {/* Info Panel */}
      {showInfoPanel && (
        <div className="vlc-info-panel" onClick={e => e.stopPropagation()}>
          <div className="vlc-info-header"><h3>Video Information</h3><button onClick={() => setShowInfoPanel(false)}><X size={16} /></button></div>
          <div className="vlc-info-content">
            <div className="vlc-info-row"><span>Title</span><span>{title}</span></div>
            <div className="vlc-info-row"><span>Folder</span><span>{folderName}</span></div>
            <div className="vlc-info-row"><span>Duration</span><span>{formatTime(duration)}</span></div>
            <div className="vlc-info-row"><span>Current Time</span><span>{formatTime(currentTime)}</span></div>
            <div className="vlc-info-row"><span>Remaining</span><span>{formatTime(remainingTime)}</span></div>
            <div className="vlc-info-row"><span>Completion</span><span>{completionPercent}%</span></div>
            <div className="vlc-info-row"><span>Speed</span><span>{playbackSpeed}x</span></div>
            <div className="vlc-info-row"><span>Study Time</span><span>{formatTime(studyTime)}</span></div>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {showContextMenu && (
        <div className="vlc-context-menu" style={{ left: showContextMenu.x, top: showContextMenu.y }} onClick={e => e.stopPropagation()}>
          <button onClick={() => { isPlaying ? handlePause() : handlePlay(); closeContextMenu() }}><Play size={14} /> {isPlaying ? 'Pause' : 'Play'}</button>
          <button onClick={() => { handleStop(); closeContextMenu() }}><Square size={14} /> Stop</button>
          <button onClick={() => { handleReplay(); closeContextMenu() }}><RotateCcw size={14} /> Replay</button>
          <div className="vlc-menu-sep" />
          <button onClick={() => { toggleFullscreen(); closeContextMenu() }}><Maximize size={14} /> Fullscreen</button>
          <button onClick={() => { togglePiP(); closeContextMenu() }}><PictureInPicture2 size={14} /> PiP</button>
          <div className="vlc-menu-sep" />
          <button onClick={() => { setShowInfoPanel(true); closeContextMenu() }}><Info size={14} /> Video Info</button>
        </div>
      )}
    </div>
  )
})

export { VideoPlayer }