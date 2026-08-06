import { useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'
import { cn } from '../utils/helpers'

export function Drawer({ isOpen, onClose, title, children, position = 'right', size = 'md' }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
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
    <div className="drawer-overlay" onClick={onClose}>
      <div className={`drawer drawer-${position} drawer-${size} ${isOpen ? 'drawer-open' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <h3 className="drawer-title">{title}</h3>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close drawer">
            <X size={20} />
          </Button>
        </div>
        <div className="drawer-body">{children}</div>
      </div>
    </div>
  )
}
