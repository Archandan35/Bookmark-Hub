import { forwardRef } from 'react'
import { Search, Command } from 'lucide-react'
import { cn } from '../utils/helpers'

export const SearchBar = forwardRef(function SearchBar({ value, onChange, placeholder = 'Search...', className, shortcut = true }, ref) {
  return (
    <div className={cn('search-bar', className)} ref={ref}>
      <Search size={18} className="search-icon" />
      <input
        type="text"
        className="search-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {shortcut && (
        <kbd className="search-shortcut">
          <Command size={12} /> K
        </kbd>
      )}
    </div>
  )
})
