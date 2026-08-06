import { cn } from '../utils/helpers'

export function Tabs({ tabs, activeTab, onChange, className }) {
  return (
    <div className={cn('tabs', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={cn('tab', activeTab === tab.id && 'tab-active')}
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
