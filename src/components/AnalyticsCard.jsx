import { memo } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '../utils/helpers'

export const AnalyticsCard = memo(function AnalyticsCard({ icon: Icon, title, value, change, changeType = 'neutral', description, className }) {
  return (
    <div className={cn('analytics-card', className)}>
      <div className="analytics-card-header">
        <div className="analytics-card-icon">
          {Icon && <Icon size={20} />}
        </div>
        {change !== undefined && (
          <div className={cn('analytics-card-change', `analytics-card-change-${changeType}`)}>
            {changeType === 'up' && <TrendingUp size={14} />}
            {changeType === 'down' && <TrendingDown size={14} />}
            <span>{change}</span>
          </div>
        )}
      </div>
      <div className="analytics-card-body">
        <p className="analytics-card-title">{title}</p>
        <p className="analytics-card-value">{value}</p>
        {description && <p className="analytics-card-desc">{description}</p>}
      </div>
    </div>
  )
})
