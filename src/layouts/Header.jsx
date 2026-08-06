import { useState, useEffect, useRef } from 'react'
import {
  Plus, Bell, Settings, Moon, Sun, LogOut, User, Crown,
} from 'lucide-react'
import { Button } from '../components/Button'
import { SearchBar } from '../components/SearchBar'
import { Avatar } from '../components/Avatar'
import { Dropdown } from '../components/Dropdown'
import { BookmarkModal } from '../components/BookmarkModal'
import { useAppStore } from '../hooks/useStore'
import { useAuthStore, useBookmarkStore } from '../hooks/useStore'
import { AuthService } from '../services/AuthService'
import { BookmarkService } from '../services/BookmarkService'
import { clearSensitiveStorage } from '../utils/security'

export function Header() {
  const { theme, toggleTheme, searchQuery, setSearchQuery } = useAppStore()
  const { user, logout } = useAuthStore()
  const { addBookmark, collections } = useBookmarkStore()
  const [showAddModal, setShowAddModal] = useState(false)
  const searchRef = useRef(null)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        searchRef.current?.querySelector('input')?.focus()
      }
      if (e.key === 'Escape') {
        searchRef.current?.querySelector('input')?.blur()
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
    } catch (err) {
      console.error('Failed to create bookmark:', err)
    }
  }

  const userMenu = [
    { label: 'Profile', icon: User },
    { label: 'Settings', icon: Settings },
    { divider: true },
    { label: 'Sign Out', icon: LogOut, onClick: handleLogout },
  ]

  return (
    <>
      <header className="header">
        <div className="header-left">
          <div className="header-logo">
            <span className="header-logo-icon">📚</span>
            <div>
              <h1 className="header-logo-text">BookmarkHub</h1>
              <p className="header-logo-subtitle">Your Knowledge. Organized.</p>
            </div>
          </div>
        </div>
        <div className="header-center" ref={searchRef}>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search bookmarks, files, notes..."
          />
        </div>
        <div className="header-right">
          <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add Bookmark
          </Button>
          <button className="header-icon-btn" aria-label="Notifications">
            <Bell size={20} />
            <span className="header-notification-dot" />
          </button>
          <button className="header-icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button className="header-icon-btn" aria-label="Settings">
            <Settings size={20} />
          </button>
          <Dropdown
            trigger={
              <div className="header-user">
                <Avatar name={user?.email || 'User'} size="sm" />
                <span className="header-username">{user?.email?.split('@')[0] || 'User'}</span>
                <Crown size={14} className="header-premium" />
              </div>
            }
            items={userMenu}
            align="right"
          />
        </div>
      </header>
      <BookmarkModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        collections={collections}
        onSave={handleBookmarkSave}
      />
    </>
  )
}
