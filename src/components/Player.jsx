import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Play, Pause, StopCircle, SkipBack, SkipForward, Volume2, VolumeX,
  Maximize, Minimize, Settings, PlayCircle,
  RotateCcw, FastForward, Rewind, Repeat, Shuffle,
} from 'lucide-react'
import { Button } from './Button'
import { cn, formatDuration } from '../utils/helpers'

const SPEED_OPTIONS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]
const ASPECT_RATIO_OPTIONS = [
  { value: 'auto', label: 'Automatic' },
  { value: '16/9', label: '16:9' },
  { value: '4/3', label: '4:3' },
  { value: '1/1', label: '1:1' },
  { value: '21/9', label: '21:9' },
]

export function Player({ src, title, onEnded, autoPlay = false, className }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [loop, setLoop] = useState(false)
  const [shuffle, setShuffle] = useState(false)
  const [isPiP, setIsPiP] = useState(false)
  const [buffered, setBuffered] = useState(0)
  const [aspectRatio, setAspectRatio] = useState('auto')
  const [showAspectRatioMenu, setShowAspectRatioMenu] = useState(false)
  const playerRef = useRef(null)
  const videoRef = useRef(null)

  // ---- Event handlers and effects ----

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => setCurrentTime(video.currentTime)
    const handleLoadedMetadata = () => setDuration(video.duration)
    const handleEnded = () => {
      if (!loop) {
        setIsPlaying(false)
        onEnded?.()
      }
    }
    const handleProgress = () => {
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1))
      }
    }
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('ended', handleEnded)
    video.addEventListener('progress', handleProgress)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('ended', handleEnded)
      video.removeEventListener('progress', handleProgress)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
    }
  }, [onEnded, loop])

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
  }, [isPlaying])

  const handleStop = () => {
    if (!videoRef.current) return
    videoRef.current.pause()
    videoRef.current.currentTime = 0
    setIsPlaying(false)
  }

  const restart = () => {
    if (!videoRef.current) return
    videoRef.current.currentTime = 0
    if (!isPlaying) videoRef.current.play()
  }

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value)
    setCurrentTime(time)
    if (videoRef.current) videoRef.current.currentTime = time
  }

  const handleSeekProgress = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const seekTime = percent * duration
    setCurrentTime(seekTime)
    if (videoRef.current) videoRef.current.currentTime = seekTime
  }

  const handleVolumeChange = (e) => {
    const vol = parseFloat(e.target.value)
    setVolume(vol)
    setIsMuted(vol === 0)
    if (videoRef.current) videoRef.current.volume = vol
  }

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
    }
    setIsMuted(!isMuted)
  }

  const changeSpeed = (speed) => {
    setPlaybackSpeed(speed)
    if (videoRef.current) videoRef.current.playbackRate = speed
    setShowSpeedMenu(false)
  }

  const skip = (seconds) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds))
    }
  }

  const ffwd = () => skip(10)
  const rew = () => skip(-10)

  const toggleFullscreen = () => {
    const container = playerRef.current
    if (!container) return
    if (isFullscreen) {
      if (document.exitFullscreen) document.exitFullscreen()
    } else {
      if (container.requestFullscreen) {
        container.requestFullscreen()
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen()
      } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen()
      }
    }
    setIsFullscreen(!isFullscreen)
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.loop = loop
  }, [loop])

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  const togglePiP = async () => {
    if (!videoRef.current) return
    try {
      if (isPiP) {
        await document.exitPictureInPicture()
        setIsPiP(false)
      } else {
        await videoRef.current.requestPictureInPicture()
        setIsPiP(true)
      }
    } catch (err) {
      console.error('PiP failed:', err)
    }
  }

  const takeScreenshot = () => {
    if (!videoRef.current) return
    const canvas = document.createElement('canvas')
    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(videoRef.current, 0, 0)
    const link = document.createElement('a')
    link.download = `${title || 'screenshot'}-${Date.now()}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleKeyDown = (e) => {
      if (e.target !== document.body && e.target !== video) return
      switch (e.key.toLowerCase()) {
        case ' ': e.preventDefault(); togglePlay(); break
        case 's':
          e.preventDefault()
          if (e.shiftKey) { takeScreenshot() } else { handleStop() }
          break
        case 'm': e.preventDefault(); toggleMute(); break
        case 'f': e.preventDefault(); toggleFullscreen(); break
        case 'n': e.preventDefault(); skip(10); break
        case 'p': e.preventDefault(); skip(-10); break
        case ']': e.preventDefault(); changeSpeed(Math.min(2, playbackSpeed + 0.25)); break
        case '[': e.preventDefault(); changeSpeed(Math.max(0.25, playbackSpeed - 0.25)); break
        case '=': e.preventDefault(); changeSpeed(1); break
        case 'arrowright': e.preventDefault(); skip(5); break
        case 'arrowleft': e.preventDefault(); skip(-5); break
        case 'arrowup': e.preventDefault(); setVolume(Math.min(1, volume + 0.05)); break
        case 'arrowdown': e.preventDefault(); setVolume(Math.max(0, volume - 0.05)); break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isPlaying, volume, playbackSpeed, loop])

  return (
    <div ref={playerRef} className={cn('player', isFullscreen && 'player-fullscreen', className)}>
      <div className="player-video-container" style={aspectRatio !== 'auto' ? { aspectRatio } : undefined}>
        <video
          ref={videoRef}
          src={src}
          className="player-video"
          autoPlay={autoPlay}
          onClick={togglePlay}
        />
        {!isPlaying && (
          <div className="player-overlay" onClick={togglePlay}>
            <PlayCircle size={64} />
          </div>
        )}
      </div>
      <div className="player-controls">
        <div className="player-time-row">
          <span className="player-time-small">
            {formatDuration(Math.floor(currentTime))}
          </span>
          <span className="player-time-small">
            / {formatDuration(Math.floor(duration))}
          </span>
        </div>
        <div className="player-progress-container" onClick={handleSeekProgress}>
          <div
            className="player-buffered-progress"
            style={{ width: `${(buffered / duration) * 100}%` }}
          />
          <input
            type="range"
            className="player-seek"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            onMouseDown={(e) => e.stopPropagation()}
          />
        </div>
        <div className="player-controls-row">
          <div className="player-left">
            <Button variant="ghost" size="icon" onClick={() => skip(-30)} aria-label="Rewind 30s">
              <SkipBack size={18} />
              <span className="player-shortcut">30s</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => skip(-10)} aria-label="Rewind 10s">
              <Rewind size={18} />
            </Button>
            {isPlaying ? (
              <Button variant="ghost" size="icon" onClick={togglePlay} aria-label="Pause">
                <Pause size={22} />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" onClick={togglePlay} aria-label="Play">
                <Play size={22} />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={handleStop} aria-label="Stop">
              <StopCircle size={20} />
            </Button>
            <Button variant="ghost" size="icon" onClick={restart} aria-label="Restart">
              <RotateCcw size={18} />
            </Button>
            <Button variant="ghost" size="icon" onClick={ffwd} aria-label="Forward 10s">
              <FastForward size={18} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => skip(30)} aria-label="Forward 30s">
              <SkipForward size={18} />
              <span className="player-shortcut">30s</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setShuffle(!shuffle)} aria-label={shuffle ? 'Disable shuffle' : 'Shuffle'}>
              <Shuffle size={16} className={cn(shuffle && 'active')} />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setLoop(!loop)} aria-label={loop ? 'Disable loop' : 'Loop'}>
              <Repeat size={16} className={cn(loop && 'active')} />
            </Button>
          </div>
          <div className="player-right">
            <div className="player-speed">
              <Button variant="ghost" size="sm" onClick={() => setShowSpeedMenu(!showSpeedMenu)} aria-label="Speed">
                <Settings size={14} /> {playbackSpeed}x
              </Button>
              {showSpeedMenu && (
                <div className="player-speed-menu">
                  {SPEED_OPTIONS.map((speed) => (
                    <button
                      key={speed}
                      className={cn('player-speed-option', playbackSpeed === speed && 'active')}
                      onClick={() => changeSpeed(speed)}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="player-aspect-ratio">
              <Button variant="ghost" size="sm" onClick={() => setShowAspectRatioMenu(!showAspectRatioMenu)} aria-label="Aspect Ratio">
                <span style={{ fontSize: '12px' }}>{ASPECT_RATIO_OPTIONS.find(a => a.value === aspectRatio)?.label || 'AR'}</span>
              </Button>
              {showAspectRatioMenu && (
                <div className="player-speed-menu">
                  {ASPECT_RATIO_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      className={cn('player-speed-option', aspectRatio === opt.value && 'active')}
                      onClick={() => { setAspectRatio(opt.value); setShowAspectRatioMenu(false) }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {'pictureInPictureEnabled' in document && (
              <Button variant="ghost" size="sm" onClick={togglePiP} aria-label={isPiP ? 'Exit PiP' : 'PiP'}>
                {isPiP ? '📱' : '📺'}
              </Button>
            )}
            <div className="player-volume">
              <Button variant="ghost" size="icon" onClick={toggleMute} aria-label={isMuted ? 'Unmute' : 'Mute'}>
                {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </Button>
              <input
                type="range"
                className="player-volume-slider"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
              />
            </div>
            <Button variant="ghost" size="icon" onClick={toggleFullscreen} aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
