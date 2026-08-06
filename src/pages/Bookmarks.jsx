import { useState } from 'react'
import { BookmarkCard } from '../components/BookmarkCard'
import { EmptyState } from '../components/EmptyState'
import { Button } from '../components/Button'
import { Tabs } from '../components/Tabs'
import { Dropdown } from '../components/Dropdown'
import { useAppStore } from '../hooks/useStore'
import { SORT_OPTIONS } from '../constants'
import { Bookmark, Grid3X3, List } from 'lucide-react'

export function Bookmarks() {
  const { viewMode, setViewMode, sortBy, setSortBy, filterType, setFilterType } = useAppStore()
  const [bookmarks] = useState([
    { id: '1', title: 'React Official Docs', description: 'The library for web and native user interfaces', url: 'https://react.dev', type: 'website', thumbnail: '', is_favorite: true, last_opened_at: new Date().toISOString(), view_count: 42 },
    { id: '2', title: 'Node.js Documentation', description: 'JavaScript runtime built on Chrome V8 engine', url: 'https://nodejs.org', type: 'website', thumbnail: '', is_favorite: false, last_opened_at: new Date(Date.now() - 3600000).toISOString(), view_count: 28 },
    { id: '3', title: 'Tailwind CSS', description: 'Utility-first CSS framework', url: 'https://tailwindcss.com', type: 'website', thumbnail: '', is_favorite: true, last_opened_at: new Date(Date.now() - 7200000).toISOString(), view_count: 35 },
    { id: '4', title: 'Figma', description: 'Collaborative interface design tool', url: 'https://figma.com', type: 'website', thumbnail: '', is_favorite: false, last_opened_at: new Date(Date.now() - 86400000).toISOString(), view_count: 19 },
    { id: '5', title: 'React Course Folder', description: 'Complete React course materials', url: '', type: 'folder', thumbnail: '', is_favorite: false, last_opened_at: new Date(Date.now() - 172800000).toISOString(), view_count: 15 },
    { id: '6', title: 'React Hooks.mp4', description: 'Deep dive into React Hooks', url: '', type: 'video', thumbnail: '', is_favorite: true, last_opened_at: new Date(Date.now() - 259200000).toISOString(), view_count: 8 },
    { id: '7', title: 'React Cheatsheet.pdf', description: 'Quick reference for React', url: '', type: 'pdf', thumbnail: '', is_favorite: false, last_opened_at: new Date(Date.now() - 345600000).toISOString(), view_count: 22 },
    { id: '8', title: 'README.md', description: 'Project documentation', url: '', type: 'markdown', thumbnail: '', is_favorite: false, last_opened_at: new Date(Date.now() - 432000000).toISOString(), view_count: 45 },
    { id: '9', title: 'Study Music.mp3', description: 'Focus music for studying', url: '', type: 'audio', thumbnail: '', is_favorite: true, last_opened_at: new Date(Date.now() - 518400000).toISOString(), view_count: 67 },
    { id: '10', title: 'Nature.jpg', description: 'Beautiful nature wallpaper', url: '', type: 'image', thumbnail: '', is_favorite: false, last_opened_at: new Date(Date.now() - 604800000).toISOString(), view_count: 3 },
  ])

  const typeFilters = [
    { id: 'all', label: 'All', count: bookmarks.length },
    { id: 'website', label: 'Websites', count: bookmarks.filter(b => b.type === 'website').length },
    { id: 'folder', label: 'Folders', count: bookmarks.filter(b => b.type === 'folder').length },
    { id: 'pdf', label: 'PDFs', count: bookmarks.filter(b => b.type === 'pdf').length },
    { id: 'video', label: 'Videos', count: bookmarks.filter(b => b.type === 'video').length },
    { id: 'audio', label: 'Audio', count: bookmarks.filter(b => b.type === 'audio').length },
    { id: 'image', label: 'Images', count: bookmarks.filter(b => b.type === 'image').length },
    { id: 'code', label: 'Code', count: bookmarks.filter(b => b.type === 'code').length },
    { id: 'note', label: 'Notes', count: bookmarks.filter(b => b.type === 'note').length },
  ]

  const filteredBookmarks = filterType === 'all'
    ? bookmarks
    : bookmarks.filter(b => b.type === filterType)

  return (
    <div className="page bookmarks-page">
      <div className="page-header">
        <h1 className="page-title">All Bookmarks</h1>
        <p className="page-subtitle">{bookmarks.length} bookmarks total</p>
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

      {filteredBookmarks.length === 0 ? (
        <EmptyState
          icon={Bookmark}
          title="No bookmarks found"
          description="Try changing your filters or add a new bookmark"
          action={() => {}}
          actionLabel="Add Bookmark"
        />
      ) : (
        <div className={`bookmarks-grid ${viewMode === 'list' ? 'bookmarks-list' : ''}`}>
          {filteredBookmarks.map((bookmark) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              onOpen={() => {}}
              onFavorite={() => {}}
              onEdit={() => {}}
              onDelete={() => {}}
              onDuplicate={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  )
}


