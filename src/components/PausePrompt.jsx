import { useState } from 'react'

export function PausePrompt({ defaultRemember = false, onResolve }) {
  const [remember, setRemember] = useState(defaultRemember)

  return (
    <div className="pause-prompt-overlay" role="dialog" aria-modal="true" aria-label="Video paused">
      <div className="pause-prompt">
        <h3 className="pause-prompt-title">Video Paused</h3>
        <p className="pause-prompt-text">Should the Study Timer continue?</p>
        <div className="pause-prompt-actions">
          <button
            type="button"
            className="learn-btn-outline-sm"
            onClick={() => onResolve('continue', remember)}
          >
            <span>Continue Timer</span>
          </button>
          <button
            type="button"
            className="learn-btn-danger"
            onClick={() => onResolve('pause', remember)}
          >
            <span>Pause Timer</span>
          </button>
        </div>
        <label className="pause-prompt-remember">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          <span>Remember my choice</span>
        </label>
      </div>
    </div>
  )
}
