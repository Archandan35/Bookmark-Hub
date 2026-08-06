import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'
import { cn } from '../utils/helpers'

export function Dialog({ isOpen, onClose, title, children, footer, size = 'md', showClose = true, className }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      dialogRef.current?.focus()
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div
        ref={dialogRef}
        className={cn('dialog', `dialog-${size}`, className)}
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <div className="dialog-header">
          <h3 className="dialog-title">{title}</h3>
          {showClose && (
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close dialog">
              <X size={20} />
            </Button>
          )}
        </div>
        <div className="dialog-body">{children}</div>
        {footer && <div className="dialog-footer">{footer}</div>}
      </div>
    </div>
  )
}
