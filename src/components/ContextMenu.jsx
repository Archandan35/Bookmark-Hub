import { useEffect, useRef } from 'react'

export function ContextMenu({ x, y, items, onClose }) {
  const ref = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose()
      }
    }
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [onClose])

  return (
    <div
      ref={ref}
      className="context-menu"
      style={{ '--menu-top': `${y}px`, '--menu-left': `${x}px` }}
    >
      {items.map((item, i) =>
        item.divider ? (
          <div key={i} className="dropdown-divider" />
        ) : (
          <button
            key={i}
            className="context-menu-item"
            onClick={() => {
              item.onClick?.()
              onClose()
            }}
          >
            {item.icon && <item.icon size={14} />}
            {item.label}
          </button>
        )
      )}
    </div>
  )
}
