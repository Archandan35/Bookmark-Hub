import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../utils/helpers'

export function Accordion({ items, className, multiple = false }) {
  const [openItems, setOpenItems] = useState([])

  const toggle = (index) => {
    if (multiple) {
      setOpenItems((prev) =>
        prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
      )
    } else {
      setOpenItems((prev) => (prev.includes(index) ? [] : [index]))
    }
  }

  return (
    <div className={cn('accordion', className)}>
      {items.map((item, index) => (
        <div key={index} className={cn('accordion-item', openItems.includes(index) && 'accordion-open')}>
          <button
            className="accordion-header"
            onClick={() => toggle(index)}
            aria-expanded={openItems.includes(index)}
          >
            <span className="accordion-title">{item.title}</span>
            <ChevronDown size={18} className="accordion-icon" />
          </button>
          <div className="accordion-content">
            <div className="accordion-content-inner">{item.content}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
