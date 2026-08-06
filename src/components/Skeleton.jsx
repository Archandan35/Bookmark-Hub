import { cn } from '../utils/helpers'

export function Skeleton({ className, ...props }) {
  return <div className={cn('skeleton', className)} {...props} />
}

export function CardSkeleton() {
  return (
    <div className="card skeleton-card">
      <Skeleton className="skeleton-thumbnail" />
      <div className="card-body">
        <Skeleton className="skeleton-title" />
        <Skeleton className="skeleton-text" />
        <Skeleton className="skeleton-text short" />
      </div>
    </div>
  )
}

export function ListSkeleton({ count = 5 }) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="skeleton-list-item" />
      ))}
    </div>
  )
}
