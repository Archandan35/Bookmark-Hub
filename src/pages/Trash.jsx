import { useState } from 'react'
import { Trash2, RotateCcw, AlertTriangle } from 'lucide-react'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { Card } from '../components/Card'
import { formatRelativeTime } from '../utils/helpers'

export function Trash() {
  const [items] = useState([])

  return (
    <div className="page trash-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Trash</h1>
          <p className="page-subtitle">Deleted items are kept for 30 days</p>
        </div>
        {items.length > 0 && (
          <Button variant="danger" size="sm">
            <Trash2 size={16} /> Empty Trash
          </Button>
        )}
      </div>

      {items.length === 0 ? (
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
                <p>Deleted {formatRelativeTime(item.deleted_at)}</p>
              </div>
              <div className="trash-item-actions">
                <Button variant="ghost" size="sm">
                  <RotateCcw size={14} /> Restore
                </Button>
                <Button variant="danger" size="sm">
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
