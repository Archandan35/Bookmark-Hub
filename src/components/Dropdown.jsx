import { useState, useRef, useEffect } from 'react'
import { cn } from '../utils/helpers'

export function Dropdown({ trigger, items, align = 'right', className }) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <div className={cn('dropdown', className)} ref={ref}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>
      {isOpen && (
        <div className={`dropdown-menu dropdown-${align}`}>
          {items.map((item, i) =>
            item.divider ? (
              <div key={i} className="dropdown-divider" />
            ) : (
              <button
                key={i}
                className="dropdown-item"
                onClick={() => {
                  item.onClick?.()
                  setIsOpen(false)
                }}
                disabled={item.disabled}
              >
                {item.icon && <item.icon size={16} />}
                <span>{item.label}</span>
              </button>
            )
          )}
        </div>
      )}
    </div>
  )
}
