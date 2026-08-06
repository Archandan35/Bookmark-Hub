import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { cn } from '../utils/helpers'

export function DatePicker({ value, onChange, label, placeholder = 'Select date', className }) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : null)
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

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()

  const handleSelect = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    setSelectedDate(date)
    onChange?.(date.toISOString())
    setIsOpen(false)
  }

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))

  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })

  return (
    <div className={cn('date-picker', className)} ref={ref}>
      {label && <label className="input-label">{label}</label>}
      <button
        className="date-picker-trigger"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <Calendar size={16} className="date-picker-icon" />
        <span className={selectedDate ? 'date-picker-value' : 'date-picker-placeholder'}>
          {selectedDate ? selectedDate.toLocaleDateString() : placeholder}
        </span>
      </button>
      {isOpen && (
        <div className="date-picker-dropdown">
          <div className="date-picker-header">
            <button onClick={prevMonth} className="date-picker-nav" aria-label="Previous month">
              <ChevronLeft size={16} />
            </button>
            <span className="date-picker-month">{monthName}</span>
            <button onClick={nextMonth} className="date-picker-nav" aria-label="Next month">
              <ChevronRight size={16} />
            </button>
          </div>
          <div className="date-picker-grid">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
              <div key={d} className="date-picker-day-label">{d}</div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="date-picker-day-empty" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const isSelected = selectedDate &&
                selectedDate.getDate() === day &&
                selectedDate.getMonth() === currentMonth.getMonth() &&
                selectedDate.getFullYear() === currentMonth.getFullYear()
              const isToday = new Date().getDate() === day &&
                new Date().getMonth() === currentMonth.getMonth() &&
                new Date().getFullYear() === currentMonth.getFullYear()
              return (
                <button
                  key={day}
                  className={cn('date-picker-day', isSelected && 'date-picker-day-selected', isToday && 'date-picker-day-today')}
                  onClick={() => handleSelect(day)}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
