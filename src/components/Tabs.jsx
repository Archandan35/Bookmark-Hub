import { cn } from '../utils/helpers'

export function Tabs({ tabs, activeTab, onChange, className, variant = 'default' }) {
  return (
    <div className={cn('tabs', variant === 'underline' && 'tabs-underline', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={cn('tab', variant === 'underline' && 'tab-underline', activeTab === tab.id && 'tab-active', activeTab === tab.id && variant === 'underline' && 'tab-underline-active')}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon && <tab.icon size={16} />}
          {tab.label}
          {tab.count !== undefined && <span className="tab-count">{tab.count}</span>}
        </button>
      ))}
    </div>
  )
}
