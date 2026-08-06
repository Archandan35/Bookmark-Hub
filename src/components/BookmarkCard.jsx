import { useState, memo } from 'react'
import {
  Heart, MoreVertical, ExternalLink, Star, Clock, Eye, Play, Image, FileText, Music, Code,
} from 'lucide-react'
import { Card } from './Card'
import { Badge } from './Badge'
import { Dropdown } from './Dropdown'
import { ContextMenu } from './ContextMenu'
import { BOOKMARK_TYPE_CONFIG, BOOKMARK_TYPES } from '../constants'
import { cn, formatRelativeTime, truncate } from '../utils/helpers'

const TYPE_ICONS = {
  [BOOKMARK_TYPES.VIDEO]: Play,
  [BOOKMARK_TYPES.AUDIO]: Music,
  [BOOKMARK_TYPES.IMAGE]: Image,
  [BOOKMARK_TYPES.PDF]: FileText,
  [BOOKMARK_TYPES.CODE]: Code,
  [BOOKMARK_TYPES.MARKDOWN]: FileText,
}

export function BookmarkCard({ bookmark, onOpen, onFavorite, onEdit, onDelete, onDuplicate }) {
  const [contextMenu, setContextMenu] = useState(null)
  const typeConfig = BOOKMARK_TYPE_CONFIG[bookmark.type] || BOOKMARK_TYPE_CONFIG.website

  const handleContextMenu = (e) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }

  const menuItems = [
    { label: 'Open', icon: ExternalLink, onClick: () => onOpen?.(bookmark) },
    { label: bookmark.is_favorite ? 'Remove Favorite' : 'Add Favorite', icon: Heart, onClick: () => onFavorite?.(bookmark) },
    { label: 'Edit', icon: Star, onClick: () => onEdit?.(bookmark) },
    { label: 'Duplicate', icon: Eye, onClick: () => onDuplicate?.(bookmark) },
    { divider: true },
    { label: 'Delete', icon: Clock, onClick: () => onDelete?.(bookmark) },
  ]

  return (
    <>
      <Card hover className="bookmark-card" onContextMenu={handleContextMenu}>
        <div className="bookmark-card-thumbnail">
          {bookmark.thumbnail ? (
            <img src={bookmark.thumbnail} alt={bookmark.title} loading="lazy" decoding="async" />
          ) : (
            <div className="bookmark-card-thumbnail-placeholder">
              <span className="bookmark-card-type-icon" style={{ '--badge-color': typeConfig.color }}>
                {bookmark.type === 'folder' ? '📁' : '🔗'}
              </span>
            </div>
          )}
          <Badge color={typeConfig.color === '#5B3FD6' ? 'purple' : typeConfig.color === '#EF4444' ? 'red' : typeConfig.color === '#F59E0B' ? 'yellow' : typeConfig.color === '#10B981' ? 'green' : typeConfig.color === '#3B82F6' ? 'blue' : 'gray'} className="bookmark-card-badge">
            {typeConfig.label}
          </Badge>
        </div>
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
                <Clock size={12} /> {formatRelativeTime(bookmark.last_opened_at)}
              </span>
            )}
          </div>
          <div className="bookmark-card-actions">
            <button
              className={cn('bookmark-card-favorite', bookmark.is_favorite && 'active')}
              onClick={(e) => {
                e.stopPropagation()
                onFavorite?.(bookmark)
              }}
            >
              <Heart size={14} fill={bookmark.is_favorite ? 'currentColor' : 'none'} />
            </button>
            <Dropdown
              trigger={
                <button className="bookmark-card-more" onClick={(e) => e.stopPropagation()}>
                  <MoreVertical size={14} />
                </button>
              }
              items={menuItems}
              align="right"
            />
          </div>
        </div>
      </Card>
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={menuItems}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  )
}

export default memo(BookmarkCard, (prev, next) => {
  return (
    prev.bookmark.id === next.bookmark.id &&
    prev.bookmark.is_favorite === next.bookmark.is_favorite &&
    prev.bookmark.title === next.bookmark.title &&
    prev.bookmark.progress === next.bookmark.progress &&
    prev.onOpen === next.onOpen &&
    prev.onFavorite === next.onFavorite &&
    prev.onEdit === next.onEdit &&
    prev.onDelete === next.onDelete &&
    prev.onDuplicate === next.onDuplicate
  )
})
