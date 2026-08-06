import { useState, useRef, useEffect } from 'react'
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Maximize, Minimize, Settings, PauseCircle, PlayCircle,
} from 'lucide-react'
import { Button } from './Button'
import { cn, formatDuration } from '../utils/helpers'

export function Player({ src, title, onEnded, autoPlay = false, className }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const playerRef = useRef(null)
  const videoRef = useRef(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => setCurrentTime(video.currentTime)
    const handleLoadedMetadata = () => setDuration(video.duration)
    const handleEnded = () => { setIsPlaying(false); onEnded?.() }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('ended', handleEnded)
    }
  }, [onEnded])

  const togglePlay = () => {
    if (!videoRef.current) return
    if (isPlaying) {
      videoRef.current.pause()
    } else {
      videoRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value)
    setCurrentTime(time)
    if (videoRef.current) videoRef.current.currentTime = time
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

  return (
    <div className={cn('player', isFullscreen && 'player-fullscreen', className)}>
      <div className="player-video-container">
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
        <div className="player-progress">
          <input
            type="range"
            className="player-seek"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
          />
        </div>
        <div className="player-controls-row">
          <div className="player-left">
            <Button variant="ghost" size="icon" onClick={() => skip(-10)} aria-label="Rewind 10s">
              <SkipBack size={18} />
            </Button>
            <Button variant="ghost" size="icon" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? <Pause size={22} /> : <Play size={22} />}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => skip(10)} aria-label="Forward 10s">
              <SkipForward size={18} />
            </Button>
            <span className="player-time">
              {formatDuration(Math.floor(currentTime))} / {formatDuration(Math.floor(duration))}
            </span>
          </div>
          <div className="player-right">
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
            <div className="player-speed">
              <Button variant="ghost" size="sm" onClick={() => setShowSpeedMenu(!showSpeedMenu)}>
                <Settings size={14} /> {playbackSpeed}x
              </Button>
              {showSpeedMenu && (
                <div className="player-speed-menu">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
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
            <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)} aria-label="Fullscreen">
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
