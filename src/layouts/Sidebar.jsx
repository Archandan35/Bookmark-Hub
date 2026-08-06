import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  ChevronLeft, ChevronRight, HardDrive, Settings, Plus, Folder,
} from 'lucide-react'
import { useAppStore } from '../hooks/useStore'
import { SIDEBAR_NAV } from '../constants'
import { cn } from '../utils/helpers'
import { TreeView } from '../components/TreeView'
import { Button } from '../components/Button'

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore()
  const [collections] = useState([
    { id: '1', name: 'Development', icon: Folder, color: '#5B3FD6', count: 24, children: { children: [] } },
    { id: '2', name: 'UGC NET', icon: Folder, color: '#EF4444', count: 18, children: { children: [] } },
    { id: '3', name: 'AI & ML', icon: Folder, color: '#10B981', count: 12, children: { children: [] } },
    { id: '4', name: 'Study Materials', icon: Folder, color: '#F59E0B', count: 36, children: { children: [] } },
    { id: '5', name: 'Personal', icon: Folder, color: '#EC4899', count: 8, children: { children: [] } },
    { id: '6', name: 'Design', icon: Folder, color: '#8B5CF6', count: 15, children: { children: [] } },
  ])

  return (
    <aside className={cn('sidebar', sidebarCollapsed && 'sidebar-collapsed')}>
      <nav className="sidebar-nav">
        {SIDEBAR_NAV.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) =>
              cn('sidebar-link', isActive && 'sidebar-link-active')
            }
          >
            <item.icon size={20} />
            {!sidebarCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {!sidebarCollapsed && (
        <>
          <div className="sidebar-divider" />
          <div className="sidebar-section">
            <div className="sidebar-section-header">
              <h3 className="sidebar-section-title">Collections</h3>
              <button className="sidebar-section-add" aria-label="Add collection">
                <Plus size={14} />
              </button>
            </div>
            <TreeView data={collections} />
          </div>
          <div className="sidebar-divider" />
          <div className="sidebar-bottom">
            <div className="sidebar-storage">
              <div className="sidebar-storage-header">
                <HardDrive size={16} />
                <span>Storage</span>
              </div>
              <div className="sidebar-storage-bar">
                <div className="sidebar-storage-fill" style={{ '--fill-width': '25%' }} />
              </div>
              <p className="sidebar-storage-text">128GB / 512GB (25%)</p>
            </div>
            <div className="sidebar-upgrade">
              <Crown size={16} />
              <div>
                <p className="sidebar-upgrade-title">Upgrade to Pro</p>
                <p className="sidebar-upgrade-desc">Unlimited storage</p>
              </div>
            </div>
            <NavLink to="/settings" className="sidebar-settings">
              <Settings size={18} />
              <span>Settings</span>
            </NavLink>
          </div>
        </>
      )}

      <button className="sidebar-toggle" onClick={toggleSidebar}>
        {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  )
}
