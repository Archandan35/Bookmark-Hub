import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'
import { RightPanel } from './RightPanel'
import { BottomDock } from './BottomDock'
import { FloatingTimer } from '../components/FloatingTimer'
import { useAppStore } from '../hooks/useStore'

export function MainLayout() {
  const { sidebarCollapsed, rightPanelOpen, bottomDockOpen } = useAppStore()

  return (
    <div className="app-layout">
      <Header sidebarCollapsed={sidebarCollapsed} />
      <div className="app-body">
        <Sidebar />
        <main className={`main-content ${sidebarCollapsed && 'sidebar-collapsed'} ${rightPanelOpen && 'with-right-panel'} ${bottomDockOpen && 'with-bottom-dock'}`}>
          <Outlet />
        </main>
        <RightPanel />
      </div>
      <BottomDock />
      <FloatingTimer />
    </div>
  )
}
