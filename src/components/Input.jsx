import { forwardRef } from 'react'
import { cn } from '../utils/helpers'

export const Input = forwardRef(function Input(
  { label, error, icon: Icon, className, ...props },
  ref
) {
  return (
    <div className="input-group">
      {label && <label className="input-label">{label}</label>}
      <div className="input-wrapper">
        {Icon && <Icon size={18} className="input-icon" />}
        <input
          ref={ref}
          className={cn('input', error && 'input-error', Icon && 'input-with-icon', className)}
          {...props}
        />
      </div>
      {error && <span className="input-error-text">{error}</span>}
    </div>
  )
})

export const Textarea = forwardRef(function Textarea(
  { label, error, className, ...props },
  ref
) {
  return (
    <div className="input-group">
      {label && <label className="input-label">{label}</label>}
      <textarea
        ref={ref}
        className={cn('input textarea', error && 'input-error', className)}
        {...props}
      />
      {error && <span className="input-error-text">{error}</span>}
    </div>
  )
})

export const Select = forwardRef(function Select(
  { label, error, options = [], className, ...props },
  ref
) {
  return (
    <div className="input-group">
      {label && <label className="input-label">{label}</label>}
      <select
        ref={ref}
        className={cn('input select', error && 'input-error', className)}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="input-error-text">{error}</span>}
    </div>
  )
})
