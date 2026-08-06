import { useState } from 'react'
import {
  BookOpen, Bookmark, FolderOpen, Video, FileText, StickyNote,
  Clock, TrendingUp, Target, Zap, Grid3X3, List,
} from 'lucide-react'
import { Card } from '../components/Card'
import { BookmarkCard } from '../components/BookmarkCard'
import { BookmarkModal } from '../components/BookmarkModal'
import { Button } from '../components/Button'
import { ProgressBar } from '../components/ProgressBar'
import { useAppStore } from '../hooks/useStore'
import { useBookmarkStore } from '../hooks/useStore'
import { useAuthStore } from '../hooks/useStore'
import { BOOKMARK_TYPES, SORT_OPTIONS } from '../constants'
import { Tabs } from '../components/Tabs'
import { Dropdown } from '../components/Dropdown'
import { BookmarkService } from '../services/BookmarkService'
import { EmptyState } from '../components/EmptyState'

export function Dashboard() {
  const { viewMode, setViewMode, sortBy, setSortBy, filterType, setFilterType } = useAppStore()
  const { user } = useAuthStore()
  const { bookmarks, setBookmarks, addBookmark, updateBookmark, removeBookmark, collections } = useBookmarkStore()
  const [editingBookmark, setEditingBookmark] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)

  const stats = [
    { icon: Clock, label: "Today's Study", value: '2h 35m', desc: 'Goal: 4h', progress: 65, color: '#5B3FD6' },
    { icon: Target, label: 'Daily Goal', value: '65%', desc: '1h 25m left', progress: 65, color: '#22C55E' },
    { icon: Bookmark, label: 'Bookmarks', value: bookmarks.length || '248', desc: '+12 this week', progress: null, color: '#3B82F6' },
    { icon: FolderOpen, label: 'Collections', value: collections.length || '18', desc: '6 active', progress: null, color: '#F59E0B' },
    { icon: Video, label: 'Videos', value: '56', desc: '12 watched', progress: null, color: '#8B5CF6' },
    { icon: FileText, label: 'PDFs', value: '34', desc: '8 read', progress: null, color: '#EF4444' },
    { icon: StickyNote, label: 'Notes', value: '89', desc: '+5 today', progress: null, color: '#EC4899' },
  ]

  const typeFilters = [
    { id: 'all', label: 'All' },
    { id: 'website', label: 'Websites' },
    { id: 'folder', label: 'Folders' },
    { id: 'pdf', label: 'PDFs' },
    { id: 'video', label: 'Videos' },
    { id: 'audio', label: 'Audio' },
    { id: 'image', label: 'Images' },
    { id: 'code', label: 'Code' },
    { id: 'note', label: 'Notes' },
  ]

  const filteredBookmarks = filterType === 'all'
    ? bookmarks
    : bookmarks.filter(b => b.type === filterType)

  const handleBookmarkOpen = async (bookmark) => {
    try {
      await BookmarkService.openBookmark(bookmark.id)
    } catch (err) {
      console.error('Failed to open bookmark:', err)
    }
  }

  const handleBookmarkFavorite = async (bookmark) => {
    try {
      const updated = await BookmarkService.toggleFavorite(bookmark.id, bookmark.is_favorite)
      updateBookmark(bookmark.id, { is_favorite: updated?.is_favorite ?? !bookmark.is_favorite })
    } catch (err) {
      console.error('Failed to toggle favorite:', err)
    }
  }

  const handleBookmarkEdit = (bookmark) => {
    setEditingBookmark(bookmark)
    setShowEditModal(true)
  }

  const handleBookmarkDelete = async (bookmark) => {
    try {
      await BookmarkService.softDelete(bookmark.id)
      removeBookmark(bookmark.id)
    } catch (err) {
      console.error('Failed to delete bookmark:', err)
    }
  }

  const handleBookmarkDuplicate = async (bookmark) => {
    try {
      const duplicate = await BookmarkService.duplicate(bookmark.id)
      if (duplicate) addBookmark(duplicate)
    } catch (err) {
      console.error('Failed to duplicate bookmark:', err)
    }
  }

  const handleEditSave = async (data) => {
    if (!editingBookmark) return
    try {
      const updated = await BookmarkService.update(editingBookmark.id, data)
      updateBookmark(editingBookmark.id, updated)
    } catch (err) {
      console.error('Failed to update bookmark:', err)
    }
  }

  return (
    <div className="dashboard">
      <div className="stats-grid">
        {stats.map((stat) => (
          <Card key={stat.label} hover className="stat-card">
            <div className="stat-card-icon" style={{ '--icon-bg': `${stat.color}15`, '--icon-color': stat.color }}>
              <stat.icon size={22} />
            </div>
            <div className="stat-card-content">
              <p className="stat-card-label">{stat.label}</p>
              <p className="stat-card-value">{stat.value}</p>
              <p className="stat-card-desc">{stat.desc}</p>
              {stat.progress !== null && <ProgressBar value={stat.progress} color="purple" size="sm" />}
            </div>
          </Card>
        ))}
      </div>

      <div className="filter-toolbar">
        <Tabs
          tabs={typeFilters}
          activeTab={filterType}
          onChange={setFilterType}
          className="filter-tabs"
        />
        <div className="filter-actions">
          <Dropdown
            trigger={
              <button className="filter-sort">
                <span>{SORT_OPTIONS.find((s) => s.value === sortBy)?.label || 'Sort'}</span>
              </button>
            }
            items={SORT_OPTIONS.map((opt) => ({
              label: opt.label,
              onClick: () => setSortBy(opt.value),
            }))}
          />
          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 size={16} />
            </button>
            <button
              className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="content-header">
        <h2 className="content-title">Recent Bookmarks</h2>
        <Button variant="ghost" size="sm">View All</Button>
      </div>

      {filteredBookmarks.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No bookmarks yet"
          description="Add your first bookmark to get started"
          action={() => {}}
          actionLabel="Add Bookmark"
        />
      ) : (
        <div className={`bookmarks-grid ${viewMode === 'list' ? 'bookmarks-list' : ''}`}>
          {filteredBookmarks.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              onOpen={handleBookmarkOpen}
              onFavorite={handleBookmarkFavorite}
              onEdit={handleBookmarkEdit}
              onDelete={handleBookmarkDelete}
              onDuplicate={handleBookmarkDuplicate}
            />
          ))}
        </div>
      )}

      {showEditModal && (
        <BookmarkModal
          isOpen={showEditModal}
          onClose={() => { setShowEditModal(false); setEditingBookmark(null) }}
          bookmark={editingBookmark}
          collections={collections}
          onSave={handleEditSave}
          onDelete={handleBookmarkDelete}
        />
      )}
    </div>
  )
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
