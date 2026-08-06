import { Button } from './Button'

export function EmptyState({ icon: Icon, title, description, action, actionLabel }) {
  return (
    <div className="empty-state">
      {Icon && (
        <div className="empty-state-icon">
          <Icon size={48} />
        </div>
      )}
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-desc">{description}</p>}
      {action && (
        <Button variant="primary" onClick={action}>
          {actionLabel || 'Get Started'}
        </Button>
      )}
    </div>
  )
}
