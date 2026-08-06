import { useState, useEffect, useMemo } from 'react'
import {
  BookOpen, Bookmark, FolderOpen, Video, FileText, StickyNote,
  Clock, TrendingUp, Target, Grid3X3, List, Plus,
} from 'lucide-react'
import { Card } from '../components/Card'
import { BookmarkCard } from '../components/BookmarkCard'
import { BookmarkModal } from '../components/BookmarkModal'
import { Button } from '../components/Button'
import { ProgressBar } from '../components/ProgressBar'
import { Viewer } from '../components/Viewer'
import { Player } from '../components/Player'
import { useAppStore } from '../hooks/useStore'
import { useBookmarkStore, useAuthStore } from '../hooks/useStore'
import { BOOKMARK_TYPES, SORT_OPTIONS } from '../constants'
import { Tabs } from '../components/Tabs'
import { Dropdown } from '../components/Dropdown'
import { BookmarkService } from '../services/BookmarkService'
import { CollectionService } from '../services/CollectionService'
import { StudyService } from '../services/StudyService'
import { EmptyState } from '../components/EmptyState'
import { secureLog } from '../utils/security'
import { useToast } from '../components/Toast'

export function Dashboard() {
  const { viewMode, setViewMode, sortBy, setSortBy, filterType, setFilterType } = useAppStore()
  const { user } = useAuthStore()
  const { bookmarks, setBookmarks, addBookmark, updateBookmark, removeBookmark, collections, setCollections, setBookmarks: storeSetBookmarks } = useBookmarkStore()
  const [editingBookmark, setEditingBookmark] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [viewerFile, setViewerFile] = useState(null)
  const [playerFile, setPlayerFile] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()

  useEffect(() => {
    loadDashboardData()
  }, [user])

  const loadDashboardData = async () => {
    if (!user) return
    setLoading(true)
    try {
      const [bookmarksData, collectionsData, sessionsData] = await Promise.all([
        BookmarkService.getAll(user.id),
        CollectionService.getAll(user.id),
        StudyService.getAll(user.id),
      ])
      setBookmarks(bookmarksData)
      setCollections(collectionsData)
      setSessions(sessionsData)
    } catch (err) {
      secureLog('error', 'Failed to load dashboard data', { error: err.message })
    } finally {
      setLoading(false)
    }
  }

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const todaySessions = sessions.filter((s) => s.started_at?.startsWith(today) && s.status === 'stopped')
    const todayDuration = todaySessions.reduce((sum, s) => sum + (s.total_duration || 0), 0)
    const todayMinutes = Math.floor(todayDuration / 60)
    const goalMinutes = 240
    const goalPercent = Math.min(100, Math.round((todayMinutes / goalMinutes) * 100))

    const typeCounts = bookmarks.reduce((acc, b) => {
      acc[b.type] = (acc[b.type] || 0) + 1
      return acc
    }, {})

    return [
      { icon: Clock, label: "Today's Study", value: `${Math.floor(todayMinutes / 60)}h ${todayMinutes % 60}m`, desc: `Goal: ${goalMinutes / 60}h`, progress: goalPercent, color: '#5B3FD6' },
      { icon: Target, label: 'Daily Goal', value: `${goalPercent}%`, desc: todayMinutes < goalMinutes ? `${goalMinutes - todayMinutes}m left` : 'Goal reached!', progress: goalPercent, color: '#22C55E' },
      { icon: Bookmark, label: 'Bookmarks', value: bookmarks.length, desc: `${bookmarks.filter(b => b.is_favorite).length} favorites`, progress: null, color: '#3B82F6' },
      { icon: FolderOpen, label: 'Collections', value: collections.length, desc: `${collections.filter(c => !c.is_archived).length} active`, progress: null, color: '#F59E0B' },
      { icon: Video, label: 'Videos', value: typeCounts.video || 0, desc: `${typeCounts.video || 0} total`, progress: null, color: '#8B5CF6' },
      { icon: FileText, label: 'PDFs', value: typeCounts.pdf || 0, desc: `${typeCounts.pdf || 0} total`, progress: null, color: '#EF4444' },
      { icon: StickyNote, label: 'Notes', value: typeCounts.note || 0, desc: `${typeCounts.note || 0} total`, progress: null, color: '#EC4899' },
    ]
  }, [bookmarks, collections, sessions])

  const typeFilters = useMemo(() => [
    { id: 'all', label: 'All', count: bookmarks.length },
    { id: 'website', label: 'Websites', count: bookmarks.filter(b => b.type === 'website').length },
    { id: 'folder', label: 'Folders', count: bookmarks.filter(b => b.type === 'folder').length },
    { id: 'pdf', label: 'PDFs', count: bookmarks.filter(b => b.type === 'pdf').length },
    { id: 'video', label: 'Videos', count: bookmarks.filter(b => b.type === 'video').length },
    { id: 'audio', label: 'Audio', count: bookmarks.filter(b => b.type === 'audio').length },
    { id: 'image', label: 'Images', count: bookmarks.filter(b => b.type === 'image').length },
    { id: 'code', label: 'Code', count: bookmarks.filter(b => b.type === 'code').length },
    { id: 'note', label: 'Notes', count: bookmarks.filter(b => b.type === 'note').length },
  ], [bookmarks])

  const filteredBookmarks = useMemo(() => filterType === 'all'
    ? bookmarks
    : bookmarks.filter(b => b.type === filterType), [bookmarks, filterType])

  const handleBookmarkOpen = async (bookmark) => {
    try {
      await BookmarkService.openBookmark(bookmark.id)
      if ([BOOKMARK_TYPES.VIDEO, BOOKMARK_TYPES.AUDIO].includes(bookmark.type)) {
        setPlayerFile(bookmark)
      } else if ([BOOKMARK_TYPES.IMAGE, BOOKMARK_TYPES.PDF, BOOKMARK_TYPES.MARKDOWN].includes(bookmark.type)) {
        setViewerFile(bookmark)
      }
    } catch (err) {
      secureLog('error', 'Failed to open bookmark', { error: err.message })
    }
  }

  const handleBookmarkFavorite = async (bookmark) => {
    try {
      const updated = await BookmarkService.toggleFavorite(bookmark.id, bookmark.is_favorite)
      updateBookmark(bookmark.id, { is_favorite: updated?.is_favorite ?? !bookmark.is_favorite })
    } catch (err) {
      secureLog('error', 'Failed to toggle favorite', { error: err.message })
    }
  }

  const handleBookmarkEdit = (bookmark) => {
    setEditingBookmark(bookmark)
    setShowEditModal(true)
  }

  const handleBookmarkDelete = async (bookmark) => {
    const previousBookmarks = [...bookmarks]
    removeBookmark(bookmark.id)
    try {
      await BookmarkService.softDelete(bookmark.id)
    } catch (err) {
      storeSetBookmarks(previousBookmarks)
      secureLog('error', 'Failed to delete bookmark', { error: err.message })
    }
  }

  const handleBookmarkDuplicate = async (bookmark) => {
    try {
      const duplicate = await BookmarkService.duplicate(bookmark.id)
      if (duplicate) addBookmark(duplicate)
    } catch (err) {
      secureLog('error', 'Failed to duplicate bookmark', { error: err.message })
    }
  }

  const handleEditSave = async (data) => {
    if (!editingBookmark) return
    try {
      const updated = await BookmarkService.update(editingBookmark.id, data)
      updateBookmark(editingBookmark.id, updated)
      addToast('Bookmark updated', 'success')
    } catch (err) {
      secureLog('error', 'Failed to update bookmark', { error: err.message })
      addToast('Failed to update bookmark', 'error')
    }
  }

  const handleBookmarkSave = async (data) => {
    if (!user) return
    try {
      const bookmark = await BookmarkService.create(user.id, data)
      addBookmark(bookmark)
      setShowAddModal(false)
      addToast('Bookmark added', 'success')
    } catch (err) {
      secureLog('error', 'Failed to create bookmark', { error: err.message })
      addToast('Failed to create bookmark', 'error')
    }
  }

  if (loading) {
    return (
      <div className="dashboard">
        <div className="stats-grid">
          {Array.from({ length: 7 }).map((_, i) => (
            <Card key={i} className="stat-card">
              <div className="skeleton skeleton-text" style={{ width: '40px', height: '40px', borderRadius: '8px' }} />
              <div className="card-body">
                <div className="skeleton skeleton-title" />
                <div className="skeleton skeleton-text" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="stats-grid">
        {stats.slice(0, 4).map((stat) => (
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
      <div className="stats-grid stats-grid-bottom">
        {stats.slice(4, 7).map((stat) => (
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
        {filteredBookmarks.length > 0 && (
          <div className="content-header-actions">
            <Button variant="primary" size="sm" onClick={() => setShowAddModal(true)}>
              <Plus size={16} /> Add Bookmark
            </Button>
          </div>
        )}
      </div>

      {filteredBookmarks.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No bookmarks yet"
          description="Add your first bookmark to get started"
          action={() => setShowAddModal(true)}
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

      {viewerFile && (
        <Viewer file={viewerFile} onClose={() => setViewerFile(null)} />
      )}
      {playerFile && (
        <Player src={playerFile.url} title={playerFile.title} onEnded={() => setPlayerFile(null)} />
      )}
      <BookmarkModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        collections={collections}
        onSave={handleBookmarkSave}
      />
    </div>
  )
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
