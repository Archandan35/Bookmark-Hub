import { useState, memo } from 'react'
import {
  Heart, Eye, Edit, Copy, Trash2, ExternalLink, Play, Pin, PinOff,
} from 'lucide-react'
import { Card } from './Card'
import { Badge } from './Badge'
import { BOOKMARK_TYPE_CONFIG } from '../constants'
import { cn, formatRelativeTime, truncate } from '../utils/helpers'
import { ViewModal } from './ViewModal'
import { ConfirmationDialog } from './ConfirmationDialog'

function getThumbnail(bookmark) {
  if (bookmark._uploadedImage) return bookmark._uploadedImage
  if (bookmark.thumbnail) return bookmark.thumbnail
  if (bookmark.url) {
    try {
      const domain = new URL(bookmark.url).origin
      return `${domain}/favicon.ico`
    } catch {
      return ''
    }
  }
  return ''
}

export function BookmarkCard({ bookmark, onOpen, onFavorite, onPin, onEdit, onDelete, onDuplicate }) {
  const [showView, setShowView] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [hovered, setHovered] = useState(false)
  const typeConfig = BOOKMARK_TYPE_CONFIG[bookmark.type] || BOOKMARK_TYPE_CONFIG.website
  const thumbnail = getThumbnail(bookmark)

  const handleRedirect = (e) => {
    e.stopPropagation()
    if (bookmark.url) {
      window.open(bookmark.url, '_blank', 'noopener,noreferrer')
    }
    onOpen?.(bookmark)
  }

  const handleDeleteClick = (e) => {
    e.stopPropagation()
    setShowDelete(true)
  }

  const confirmDelete = () => {
    onDelete?.(bookmark)
    setShowDelete(false)
  }

  return (
    <>
      <Card
        hover
        className="bookmark-card"
        onClick={() => setShowView(true)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="bookmark-card-thumbnail">
          {thumbnail ? (
            <img src={thumbnail} alt={bookmark.title} loading="lazy" decoding="async" />
          ) : (
            <div className="bookmark-card-thumbnail-placeholder">
              <span className="bookmark-card-type-icon" style={{ '--badge-color': typeConfig.color }}>
                {bookmark.type === 'folder' ? '📁' : '🔗'}
              </span>
            </div>
          )}

          {hovered && (
            <div className="thumbnail-overlay">
              <button
                className="thumbnail-redirect-btn"
                onClick={handleRedirect}
                aria-label="Open link"
              >
                <ExternalLink size={28} />
              </button>
            </div>
          )}
        </div>
        {hovered && (
          <button
            className="card-delete-btn"
            onClick={handleDeleteClick}
            aria-label="Delete"
          >
            <Trash2 size={14} />
          </button>
        )}
        {hovered && (
          <button
            className={`card-pin-btn ${bookmark.is_pinned ? 'active' : ''}`}
            onClick={(e) => { e.stopPropagation(); onPin?.(bookmark) }}
            title={bookmark.is_pinned ? 'Unpin' : 'Pin'}
          >
            {bookmark.is_pinned ? <Pin size={14} fill="currentColor" /> : <PinOff size={14} />}
          </button>
        )}
        <Badge color={typeConfig.color === '#5B3FD6' ? 'purple' : typeConfig.color === '#EF4444' ? 'red' : typeConfig.color === '#F59E0B' ? 'yellow' : typeConfig.color === '#10B981' ? 'green' : typeConfig.color === '#3B82F6' ? 'blue' : 'gray'} className="bookmark-card-badge">
          {typeConfig.label}
        </Badge>
        <div className="bookmark-card-body">
          <h4 className="bookmark-card-title" title={bookmark.title}>
            {truncate(bookmark.title, 40)}
          </h4>
          {bookmark.description && (
            <p className="bookmark-card-desc">{truncate(bookmark.description, 60)}</p>
          )}
          {bookmark.url && (
            <p className="bookmark-card-url">{truncate(bookmark.url, 40)}</p>
          )}
        </div>
        <div className="bookmark-card-footer">
          <div className="bookmark-card-meta">
            {bookmark.last_opened_at && (
              <span className="bookmark-card-time">
                <Play size={12} /> {formatRelativeTime(bookmark.last_opened_at)}
              </span>
            )}
          </div>
          <div className="bookmark-card-actions">
            <button
              className={cn('bookmark-card-action', bookmark.is_favorite && 'active')}
              onClick={(e) => { e.stopPropagation(); onFavorite?.(bookmark) }}
              title={bookmark.is_favorite ? 'Remove Favorite' : 'Favorite'}
            >
              <Heart size={14} fill={bookmark.is_favorite ? 'currentColor' : 'none'} />
            </button>
            <button
              className="bookmark-card-action"
              onClick={(e) => { e.stopPropagation(); setShowView(true) }}
              title="View"
            >
              <Eye size={14} />
            </button>
            <button
              className="bookmark-card-action"
              onClick={(e) => { e.stopPropagation(); onEdit?.(bookmark) }}
              title="Edit"
            >
              <Edit size={14} />
            </button>
            <button
              className="bookmark-card-action"
              onClick={(e) => { e.stopPropagation(); onDuplicate?.(bookmark) }}
              title="Duplicate"
            >
              <Copy size={14} />
            </button>
            <button
              className="bookmark-card-action danger"
              onClick={(e) => { e.stopPropagation(); handleDeleteClick(e) }}
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </Card>

      {showView && (
        <ViewModal bookmark={bookmark} onClose={() => setShowView(false)} onEdit={(b) => { setShowView(false); onEdit?.(b) }} />
      )}

      {showDelete && (
        <ConfirmationDialog
          isOpen={showDelete}
          onClose={() => setShowDelete(false)}
          onConfirm={confirmDelete}
          title="Delete Bookmark"
          message={`Are you sure you want to delete "${bookmark.title}"? This action cannot be undone.`}
          confirmLabel="Delete"
          variant="danger"
        />
      )}
    </>
  )
}

export default memo(BookmarkCard, (prev, next) => {
  return (
    prev.bookmark.id === next.bookmark.id &&
    prev.bookmark.is_favorite === next.bookmark.is_favorite &&
    prev.bookmark.is_pinned === next.bookmark.is_pinned &&
    prev.bookmark.title === next.bookmark.title &&
    prev.bookmark.thumbnail === next.bookmark.thumbnail &&
    prev.bookmark.progress === next.bookmark.progress &&
    prev.onOpen === next.onOpen &&
    prev.onFavorite === next.onFavorite &&
    prev.onPin === next.onPin &&
    prev.onEdit === next.onEdit &&
    prev.onDelete === next.onDelete &&
    prev.onDuplicate === next.onDuplicate
  )
})
