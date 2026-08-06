import { useState, useEffect } from 'react'
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { Card } from '../components/Card'
import { useAuthStore } from '../hooks/useStore'
import { BookmarkService } from '../services/BookmarkService'
import { useToast } from '../components/Toast'
import { formatRelativeTime } from '../utils/helpers'

export function Trash() {
  const { user } = useAuthStore()
  const { addToast } = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadTrash()
  }, [user])

  const loadTrash = async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await BookmarkService.getTrash(user.id)
      setItems(data)
    } catch (err) {
      console.error('Failed to load trash:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (item) => {
    try {
      await BookmarkService.restore(item.id)
      setItems((prev) => prev.filter((i) => i.id !== item.id))
      addToast('Bookmark restored', 'success')
    } catch (err) {
      addToast('Failed to restore', 'error')
    }
  }

  const handleDeleteForever = async (item) => {
    try {
      await BookmarkService.delete(item.id)
      setItems((prev) => prev.filter((i) => i.id !== item.id))
      addToast('Bookmark deleted permanently', 'success')
    } catch (err) {
      addToast('Failed to delete', 'error')
    }
  }

  const handleEmptyTrash = async () => {
    try {
      await Promise.all(items.map((item) => BookmarkService.delete(item.id)))
      setItems([])
      addToast('Trash emptied', 'success')
    } catch (err) {
      addToast('Failed to empty trash', 'error')
    }
  }

  return (
    <div className="page trash-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Trash</h1>
          <p className="page-subtitle">Deleted items are kept for 30 days</p>
        </div>
        {items.length > 0 && (
          <Button variant="danger" size="sm" onClick={handleEmptyTrash}>
            <Trash2 size={16} /> Empty Trash
          </Button>
        )}
      </div>

      {loading ? (
        <div className="trash-list">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="trash-item">
              <div className="skeleton skeleton-text" style={{ width: '100%' }} />
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Trash2}
          title="Trash is empty"
          description="Deleted bookmarks and collections will appear here"
        />
      ) : (
        <div className="trash-list">
          {items.map((item) => (
            <Card key={item.id} className="trash-item">
              <div className="trash-item-content">
                <h4>{item.title}</h4>
                <p>Deleted {item.deleted_at ? formatRelativeTime(item.deleted_at) : 'Unknown'}</p>
              </div>
              <div className="trash-item-actions">
                <Button variant="ghost" size="sm" onClick={() => handleRestore(item)}>
                  <RotateCcw size={14} /> Restore
                </Button>
                <Button variant="danger" size="sm" onClick={() => handleDeleteForever(item)}>
                  <Trash2 size={14} /> Delete Forever
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
