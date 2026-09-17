import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Bell, Settings, Moon, Sun, LogOut, User, Star, Menu, X, RefreshCw,
  Play, Square, Timer,
} from 'lucide-react'
import { Button } from '../components/Button'
import { SearchBar } from '../components/SearchBar'
import { Avatar } from '../components/Avatar'
import { Dropdown } from '../components/Dropdown'
import { BookmarkModal } from '../components/BookmarkModal'
import { StudySessionPipModal } from '../components/study/StudySessionPipModal'
import { studySessionController } from '../services/studySessionController'
import { useSessionStore } from '../hooks/useSessionStore'
import { useExamStore } from '../hooks/useExamStore'
import { deriveStatus } from '../services/ExamService'
import { useAppStore } from '../hooks/useStore'
import { useAuthStore, useBookmarkStore } from '../hooks/useStore'
import { AuthService } from '../services/AuthService'
import { BookmarkService } from '../services/BookmarkService'
import { clearSensitiveStorage } from '../utils/security'
import { useToast } from '../components/Toast'
import { formatRelativeTime, formatDuration } from '../utils/helpers'

export function Header({ sidebarCollapsed }) {
  const navigate = useNavigate()
  const { theme, toggleTheme, searchQuery, setSearchQuery, toggleSidebar } = useAppStore()
  const { user, logout } = useAuthStore()
  const { addBookmark, collections, bookmarks } = useBookmarkStore()
  const { addToast } = useToast()
  const [showAddModal, setShowAddModal] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showStartStudy, setShowStartStudy] = useState(false)
  const searchRef = useRef(null)

  const activeSession = useSessionStore((s) => s.activeSession)
  const sessionPhase = useSessionStore((s) => s.sessionPhase)
  const getElapsedSeconds = useSessionStore((s) => s.getElapsedSeconds)
  useSessionStore((s) => s.now)
  const hasSession = !!activeSession && (sessionPhase === 'active' || sessionPhase === 'paused')
  const isRunning = hasSession && activeSession.runningSince != null
  const elapsedLabel = hasSession ? formatDuration(getElapsedSeconds()) : ''

  const exams = useExamStore((s) => s.exams)
  const loadExams = useExamStore((s) => s.loadExams)
  const bumpAllExams = useExamStore((s) => s.bumpAllExams)
  const examsLoadedFor = useRef(null)
  useEffect(() => {
    if (user && examsLoadedFor.current !== user.id) {
      examsLoadedFor.current = user.id
      loadExams(user.id)
    }
  }, [user, loadExams])
  const upcomingCount = exams.filter((e) =>
    ['upcoming', 'tomorrow', 'today'].includes(deriveStatus(e))
  ).length

  const recentBookmarks = [...bookmarks]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 5)

  const notifications = recentBookmarks.map((b) => ({
    id: b.id,
    message: `New bookmark: ${b.title}`,
    time: formatRelativeTime(b.created_at),
    read: false,
  }))

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.querySelector('input')?.focus()
      }
      if (e.key === 'Escape') {
        searchRef.current?.querySelector('input')?.blur()
        setShowNotifications(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleLogout = async () => {
    await AuthService.signOut()
    clearSensitiveStorage()
    logout()
  }

  const handleBookmarkSave = async (data) => {
    if (!user) return
    try {
      const bookmark = await BookmarkService.create(user.id, data)
      addBookmark(bookmark)
      addToast('Bookmark added', 'success')
    } catch (err) {
      addToast('Failed to create bookmark', 'error')
    }
  }

  const handleSessionButton = async () => {
    if (!hasSession) {
      setShowStartStudy(true)
      return
    }
    try {
      if (isRunning) {
        const result = await studySessionController.stopStudy()
        if (!result?.completed) {
          addToast('Session too short to record', 'info')
        } else {
          addToast('Session completed', 'success')
        }
        return
      }
      studySessionController.resume()
    } catch {
      // Fall back to a fresh start if resume/stop fails on a stale session.
      setShowStartStudy(true)
    }
  }

  const userName = user?.user_metadata?.name || user?.email?.split('@')[0] || 'User'
  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <>
      <header className="header">
        <button className="header-hamburger" onClick={toggleSidebar} aria-label="Toggle sidebar">
          <Menu size={22} />
        </button>
        <div className={`header-sidebar-section ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="header-logo">
            <span className="header-logo-icon">📚</span>
            {!sidebarCollapsed && (
              <div>
                <h1 className="header-logo-text">BookmarkHub</h1>
                <p className="header-logo-subtitle">Your Knowledge. Organized.</p>
              </div>
            )}
          </div>
        </div>
        <div className="header-main-section">
          <div className="header-search-row">
            <div className="header-center" ref={searchRef}>
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search bookmarks, files, notes..."
              />
            </div>
          </div>
          <div className="header-right">
            <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
              <Plus size={16} /> <span className="header-btn-label">Add Bookmark</span>
            </Button>
            {!hasSession ? (
              <Button variant="secondary" size="sm" onClick={handleSessionButton}>
                <Play size={16} /> <span className="header-btn-label">Start Session</span>
              </Button>
            ) : isRunning ? (
              <Button variant="danger" size="sm" onClick={handleSessionButton}>
                <Square size={16} /> <span className="header-btn-label">Stop{elapsedLabel ? ` · ${elapsedLabel}` : ''}</span>
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={handleSessionButton}>
                <Play size={16} /> <span className="header-btn-label">Continue{elapsedLabel ? ` · ${elapsedLabel}` : ''}</span>
              </Button>
            )}
            <div className="header-notification-wrapper">
              <button className="header-icon-btn" aria-label="Upcoming exams" title="Upcoming exams" onClick={() => { navigate('/exams'); bumpAllExams() }}>
                <Timer size={20} />
                {upcomingCount > 0 && <span className="header-exam-count">{upcomingCount}</span>}
              </button>
            </div>
            <div className="header-notification-wrapper">
              <button className="header-icon-btn" aria-label="Notifications" onClick={() => setShowNotifications(!showNotifications)}>
                <Bell size={20} />
                {unreadCount > 0 && <span className="header-notification-dot" />}
              </button>
              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h4>Notifications</h4>
                    <button onClick={() => setShowNotifications(false)} aria-label="Close">
                      <X size={16} />
                    </button>
                  </div>
                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <p className="notification-empty">No notifications</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="notification-item">
                          <div className="notification-dot" />
                          <div className="notification-content">
                            <p className="notification-message">{n.message}</p>
                            <p className="notification-time">{n.time}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <button className="header-icon-btn" onClick={toggleTheme} aria-label="Toggle theme" title="Dark / light mode">
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="header-icon-btn header-hide-sm" aria-label="Settings" onClick={() => navigate('/settings')}>
              <Settings size={20} />
            </button>
            <button
              className="header-icon-btn header-hide-sm"
              aria-label="Refresh page"
              title="Refresh page"
              onClick={() => window.location.reload()}
            >
              <RefreshCw size={20} />
            </button>
            <Dropdown
              trigger={
                <div className="header-user">
                  <Avatar name={userName} size="sm" />
                  <span className="header-username">{userName}</span>
                  <Star size={14} className="header-premium" />
                </div>
              }
              items={[
                { label: 'Profile', icon: User, onClick: () => navigate('/settings') },
                { label: 'Settings', icon: Settings, onClick: () => navigate('/settings') },
                { divider: true },
                { label: 'Sign Out', icon: LogOut, onClick: handleLogout },
              ]}
              align="right"
            />
          </div>
        </div>
      </header>
      <BookmarkModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        collections={collections}
        onSave={handleBookmarkSave}
      />
      <StudySessionPipModal
        open={showStartStudy}
        onClose={() => setShowStartStudy(false)}
      />
    </>
  )
}
