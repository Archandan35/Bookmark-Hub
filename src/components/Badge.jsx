import { cn } from '../utils/helpers'

const colors = {
  purple: 'badge-purple',
  blue: 'badge-blue',
  red: 'badge-red',
  green: 'badge-green',
  yellow: 'badge-yellow',
  gray: 'badge-gray',
  pink: 'badge-pink',
}

export function Badge({ children, color = 'purple', className }) {
  return (
    <span className={cn('badge', colors[color], className)}>
      {children}
    </span>
  )
}
