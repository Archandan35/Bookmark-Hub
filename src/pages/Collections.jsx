import { useState } from 'react'
import { FolderOpen, Plus, MoreVertical, Edit, Trash2, Copy } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { Dropdown } from '../components/Dropdown'
import { useAppStore } from '../hooks/useStore'

export function Collections() {
  const [collections] = useState([
    { id: '1', name: 'Development', description: 'Web and app development resources', icon: 'Folder', color: '#5B3FD6', count: 24, bookmarks: 24 },
    { id: '2', name: 'UGC NET', description: 'UGC NET exam preparation', icon: 'Folder', color: '#EF4444', count: 18, bookmarks: 18 },
    { id: '3', name: 'AI & ML', description: 'Artificial Intelligence and Machine Learning', icon: 'Folder', color: '#10B981', count: 12, bookmarks: 12 },
    { id: '4', name: 'Study Materials', description: 'General study materials', icon: 'Folder', color: '#F59E0B', count: 36, bookmarks: 36 },
    { id: '5', name: 'Personal', description: 'Personal bookmarks', icon: 'Folder', color: '#EC4899', count: 8, bookmarks: 8 },
    { id: '6', name: 'Design', description: 'UI/UX design resources', icon: 'Folder', color: '#8B5CF6', count: 15, bookmarks: 15 },
    { id: '7', name: 'Law', description: 'Legal study materials', icon: 'Folder', color: '#3B82F6', count: 10, bookmarks: 10 },
    { id: '8', name: 'Finance', description: 'Finance and accounting', icon: 'Folder', color: '#14B8A6', count: 7, bookmarks: 7 },
  ])

  const getMenuItems = (collection) => [
    { label: 'Edit', icon: Edit, onClick: () => {} },
    { label: 'Duplicate', icon: Copy, onClick: () => {} },
    { divider: true },
    { label: 'Delete', icon: Trash2, onClick: () => {} },
  ]

  return (
    <div className="page collections-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Collections</h1>
          <p className="page-subtitle">{collections.length} collections</p>
        </div>
        <Button variant="primary" size="sm">
          <Plus size={16} /> New Collection
        </Button>
      </div>

      {collections.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No collections yet"
          description="Create your first collection to organize your bookmarks"
          action={() => {}}
          actionLabel="Create Collection"
        />
      ) : (
        <div className="collections-grid">
          {collections.map((collection) => (
            <Card key={collection.id} hover className="collection-card">
              <div className="collection-card-header">
                <div className="collection-card-icon" style={{ '--icon-bg': `${collection.color}15`, '--icon-color': collection.color }}>
                  <FolderOpen size={24} />
                </div>
                <Dropdown
                  trigger={
                    <button className="collection-card-more">
                      <MoreVertical size={16} />
                    </button>
                  }
                  items={getMenuItems(collection)}
                  align="right"
                />
              </div>
              <h3 className="collection-card-name">{collection.name}</h3>
              <p className="collection-card-desc">{collection.description}</p>
              <div className="collection-card-footer">
                <span className="collection-card-count">{collection.count} items</span>
                <span className="collection-card-updated">Updated 2d ago</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
