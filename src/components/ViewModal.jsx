import { X, ExternalLink, Heart, MousePointer, Edit } from 'lucide-react'
import { Button } from './Button'
import { BOOKMARK_TYPE_CONFIG } from '../constants'

export function ViewModal({ bookmark, onClose, onEdit }) {
  if (!bookmark) return null

  const typeConfig = BOOKMARK_TYPE_CONFIG[bookmark.type] || BOOKMARK_TYPE_CONFIG.website

  const getThumbnail = () => {
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

  const thumbnail = getThumbnail()

  const handleOpenUrl = () => {
    if (bookmark.url) {
      window.open(bookmark.url, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div className="modal-overlay">
      <div className="view-modal" onClick={(e) => e.stopPropagation()}>
        <div className="view-modal-header">
          <h3 className="view-modal-title">{bookmark.title}</h3>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <X size={20} />
          </Button>
        </div>
        <div className="view-modal-body">
          {thumbnail && (
            <div className="view-modal-thumbnail">
              <img src={thumbnail} alt={bookmark.title} />
            </div>
          )}
          <div className="view-modal-info">
            <div className="view-modal-type">
              <span className="view-modal-type-badge" style={{ background: `${typeConfig.color}15`, color: typeConfig.color }}>
                {typeConfig.label}
              </span>
              {bookmark.is_favorite && (
                <span className="view-modal-favorite">
                  <Heart size={14} fill="currentColor" /> Favorite
                </span>
              )}
            </div>
            {bookmark.description && (
              <p className="view-modal-desc">{bookmark.description}</p>
            )}
            {bookmark.url && (
              <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="view-modal-url">
                <ExternalLink size={14} /> {bookmark.url}
              </a>
            )}
            <div className="view-modal-meta">
              {bookmark.type && <span>Type: {bookmark.type}</span>}
              {bookmark.created_at && <span>Created: {new Date(bookmark.created_at).toLocaleDateString()}</span>}
              {bookmark.last_opened_at && <span>Last opened: {new Date(bookmark.last_opened_at).toLocaleDateString()}</span>}
              {(bookmark.view_count || 0) > 0 && (
                <span className="view-modal-clicks">
                  <MousePointer size={12} /> Clicked: {bookmark.view_count} {bookmark.view_count === 1 ? 'time' : 'times'}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="view-modal-footer">
          <Button variant="secondary" size="sm" onClick={onClose}>Close</Button>
          <Button variant="secondary" size="sm" onClick={() => onEdit?.(bookmark)}>
            <Edit size={14} /> Edit
          </Button>
          {bookmark.url && (
            <Button variant="primary" size="sm" onClick={handleOpenUrl}>
              <ExternalLink size={14} /> Open Link
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
