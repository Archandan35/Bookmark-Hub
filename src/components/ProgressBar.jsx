import { cn } from '../utils/helpers'

export function ProgressBar({ value = 0, max = 100, size = 'md', color = 'purple', showLabel = false, className }) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div className={cn('progress', `progress-${size}`, className)}>
      <div className="progress-track">
        <div
          className={`progress-fill progress-${color}`}
          style={{ '--fill-width': `${percent}%` }}
        />
      </div>
      {showLabel && <span className="progress-label">{Math.round(percent)}%</span>}
    </div>
  )
}
