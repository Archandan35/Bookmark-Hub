import { cn, getInitials } from '../utils/helpers'

export function Avatar({ src, name, size = 'md', className }) {
  const sizes = {
    sm: 'avatar-sm',
    md: 'avatar-md',
    lg: 'avatar-lg',
  }

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={cn('avatar', sizes[size], className)}
      />
    )
  }

  return (
    <div className={cn('avatar avatar-fallback', sizes[size], className)}>
      {name ? getInitials(name) : '?'}
    </div>
  )
}
