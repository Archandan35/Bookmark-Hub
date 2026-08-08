import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { BookmarkCard } from '../components/BookmarkCard'
import { BookmarkModal } from '../components/BookmarkModal'
import { EmptyState } from '../components/EmptyState'
import { Tabs } from '../components/Tabs'
import { Dropdown } from '../components/Dropdown'
import { Pagination } from '../components/Pagination'
import { ImportExport } from '../components/ImportExport'
import { useAppStore } from '../hooks/useStore'
import { useBookmarkStore, useAuthStore } from '../hooks/useStore'
import { SORT_OPTIONS } from '../constants'
import { Bookmark, Grid3X3, List } from 'lucide-react'
import { BookmarkService } from '../services/BookmarkService'
import { useToast } from '../components/Toast'
import { Viewer } from '../components/Viewer'
import { Player } from '../components/Player'
import { VirtualGrid } from '../components/VirtualGrid'
import { BOOKMARK_TYPES } from '../constants'
import { debounce } from '../utils/helpers'

const ITEMS_PER_PAGE = 12

export function Bookmarks() {
  const location = useLocation()
  const isFavoritesPage = location.pathname === '/favorites'
  const isPinnedPage = location.pathname === '/pinned'
  const isRecentPage = location.pathname === '/recent'
  const { viewMode, setViewMode, sortBy, setSortBy, filterType, setFilterType, searchQuery, setSearchQuery } = useAppStore()
  const { user } = useAuthStore()
  const { bookmarks, setBookmarks, addBookmark, updateBookmark, removeBookmark, collections } = useBookmarkStore()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [viewerFile, setViewerFile] = useState(null)
  const [playerFile, setPlayerFile] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [editingBookmark, setEditingBookmark] = useState(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)

  const filteredBookmarks = (() => {
    let result = bookmarks
    
    if (isFavoritesPage) {
      result = result.filter(b => b.is_favorite)
    }
    if (isPinnedPage) {
      result = result.filter(b => b.is_pinned)
    }
    
    if (filterType !== 'all') {
      result = result.filter(b => b.type === filterType)
    }
    
    return result
  })()

  const typeFilters = [
    { id: 'all', label: 'All', count: filteredBookmarks.length },
    { id: 'website', label: 'Websites', count: filteredBookmarks.filter(b => b.type === 'website').length },
    { id: 'folder', label: 'Folders', count: filteredBookmarks.filter(b => b.type === 'folder').length },
    { id: 'pdf', label: 'PDFs', count: filteredBookmarks.filter(b => b.type === 'pdf').length },
    { id: 'video', label: 'Videos', count: filteredBookmarks.filter(b => b.type === 'video').length },
    { id: 'audio', label: 'Audio', count: filteredBookmarks.filter(b => b.type === 'audio').length },
    { id: 'image', label: 'Images', count: filteredBookmarks.filter(b => b.type === 'image').length },
    { id: 'code', label: 'Code', count: filteredBookmarks.filter(b => b.type === 'code').length },
    { id: 'note', label: 'Notes', count: filteredBookmarks.filter(b => b.type === 'note').length },
  ]

  useEffect(() => {
    loadBookmarks()
  }, [user])

  useEffect(() => {
    const debouncedSearch = debounce(() => {
      if (searchQuery) {
        handleSearch()
      } else {
        loadBookmarks()
      }
    }, 300)
    debouncedSearch()
    return () => debouncedSearch.cancel?.()
  }, [searchQuery])

  const loadBookmarks = async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await BookmarkService.getAll(user.id)
      setBookmarks(data)
    } catch (err) {
      console.error('Failed to load bookmarks:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!user || !searchQuery) return
    setLoading(true)
    try {
      const data = await BookmarkService.search(user.id, searchQuery)
      setBookmarks(data)
    } catch (err) {
      console.error('Search failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const sortedBookmarks = [...filteredBookmarks].sort((a, b) => {
    if (a.is_pinned && !b.is_pinned) return -1
    if (!a.is_pinned && b.is_pinned) return 1
    switch (sortBy) {
      case 'newest': return new Date(b.created_at || 0) - new Date(a.created_at || 0)
      case 'oldest': return new Date(a.created_at || 0) - new Date(b.created_at || 0)
      case 'alphabetical': return (a.title || '').localeCompare(b.title || '')
      case 'most_viewed': return (b.view_count || 0) - (a.view_count || 0)
      case 'recently_opened': return new Date(b.last_opened_at || 0) - new Date(a.last_opened_at || 0)
      default: return 0
    }
  })

  const totalPages = Math.ceil(sortedBookmarks.length / ITEMS_PER_PAGE)
  const paginatedBookmarks = sortedBookmarks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleBookmarkOpen = async (bookmark) => {
    try {
      await BookmarkService.openBookmark(bookmark.id)
      if ([BOOKMARK_TYPES.VIDEO, BOOKMARK_TYPES.AUDIO].includes(bookmark.type)) {
        setPlayerFile(bookmark)
      } else if ([BOOKMARK_TYPES.IMAGE, BOOKMARK_TYPES.PDF, BOOKMARK_TYPES.MARKDOWN].includes(bookmark.type)) {
        setViewerFile(bookmark)
      }
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

  const handleBookmarkPin = async (bookmark) => {
    const newPinnedState = !bookmark.is_pinned
    updateBookmark(bookmark.id, { is_pinned: newPinnedState })
    try {
      await BookmarkService.togglePin(bookmark.id, bookmark.is_pinned)
    } catch (err) {
      updateBookmark(bookmark.id, { is_pinned: bookmark.is_pinned })
      console.error('Failed to toggle pin', err)
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
      console.error('Failed to duplicate:', err)
    }
  }

  const handleEditSave = async (data) => {
    if (!editingBookmark) return
    try {
      const updated = await BookmarkService.update(editingBookmark.id, data)
      updateBookmark(editingBookmark.id, updated)
    } catch (err) {
      console.error('Failed to update:', err)
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
      addToast('Failed to create bookmark', 'error')
    }
  }

  return (
    <div className="page bookmarks-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">All Bookmarks</h1>
          <p className="page-subtitle">{bookmarks.length} bookmarks total</p>
        </div>
        <ImportExport
          exportData={bookmarks}
          exportFilename="bookmarks"
          onImport={async (items) => {
            if (!user) return
            let imported = 0
            for (const item of items) {
              try {
                const b = await BookmarkService.create(user.id, item)
                addBookmark(b)
                imported++
              } catch (err) {
                console.error('Failed to import item:', err)
              }
            }
            if (imported > 0) {
              addToast(`Imported ${imported} bookmarks`, 'success')
            }
          }}
        />
      </div>

      <div className="filter-toolbar">
        <Tabs
          tabs={typeFilters}
          activeTab={filterType}
          onChange={(type) => { setFilterType(type); setCurrentPage(1) }}
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
              onClick: () => { setSortBy(opt.value); setCurrentPage(1) },
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

      {loading ? (
        <div className="bookmarks-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card skeleton-card">
              <div className="skeleton skeleton-thumbnail" />
              <div className="card-body">
                <div className="skeleton skeleton-title" />
                <div className="skeleton skeleton-text" />
              </div>
            </div>
          ))}
        </div>
      ) : paginatedBookmarks.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No bookmarks found"
          description={searchQuery ? 'Try a different search term' : 'Add your first bookmark to get started'}
          action={() => setShowAddModal(true)}
          actionLabel="Add Bookmark"
        />
      ) : (
        <>
          {paginatedBookmarks.length > 30 ? (
            <VirtualGrid
              items={paginatedBookmarks}
              minItemWidth={300}
              gap={24}
              renderItem={(bookmark) => (
                <BookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  onOpen={handleBookmarkOpen}
                  onFavorite={handleBookmarkFavorite}
                  onPin={handleBookmarkPin}
                  onEdit={handleBookmarkEdit}
                  onDelete={handleBookmarkDelete}
                  onDuplicate={handleBookmarkDuplicate}
                />
              )}
            />
          ) : (
            <div className={`bookmarks-grid ${viewMode === 'list' ? 'bookmarks-list' : ''}`}>
              {paginatedBookmarks.map((bookmark) => (
                <BookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  onOpen={handleBookmarkOpen}
                  onFavorite={handleBookmarkFavorite}
                  onPin={handleBookmarkPin}
                  onEdit={handleBookmarkEdit}
                  onDelete={handleBookmarkDelete}
                  onDuplicate={handleBookmarkDuplicate}
                />
              ))}
            </div>
          )}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onChange={setCurrentPage}
          />
        </>
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

      <BookmarkModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        collections={collections}
        onSave={handleBookmarkSave}
      />

      {viewerFile && <Viewer file={viewerFile} onClose={() => setViewerFile(null)} />}
      {playerFile && <Player src={playerFile.url} title={playerFile.title} onEnded={() => setPlayerFile(null)} />}
    </div>
  )
}
