import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import {
  ChevronLeft, ChevronRight, HardDrive, Settings, Plus, Folder, Star,
} from 'lucide-react'
import { useAppStore } from '../hooks/useStore'
import { useBookmarkStore, useAuthStore } from '../hooks/useStore'
import { SIDEBAR_NAV } from '../constants'
import { cn } from '../utils/helpers'
import { TreeView } from '../components/TreeView'
import { Dialog } from '../components/Dialog'
import { Input } from '../components/Input'
import { Button } from '../components/Button'
import { CollectionService } from '../services/CollectionService'
import { useToast } from '../components/Toast'

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useAppStore()
  const { user } = useAuthStore()
  const { collections, bookmarks, addCollection } = useBookmarkStore()
  const { addToast } = useToast()
  const [showCreate, setShowCreate] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const usedStorage = bookmarks.length * 0.5
  const totalStorage = 512
  const storagePercent = Math.min(100, Math.round((usedStorage / totalStorage) * 100))

  const buildTree = (items, parentId = null) => {
    return items
      .filter((c) => c.parent_id === parentId)
      .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
      .map((c) => ({
        id: c.id,
        name: c.name,
        icon: Folder,
        color: c.color || '#5B3FD6',
        count: bookmarks.filter(b => b.collection_id === c.id).length,
        children: buildTree(items, c.id),
      }))
  }

  const treeData = buildTree(collections)

  const parentOptions = [
    { value: '', label: 'None (Top Level)' },
    ...collections.map((c) => ({ value: c.id, label: c.name })),
  ]

  const handleCreate = async (data) => {
    if (!user) return
    try {
      const collection = await CollectionService.create(user.id, {
        name: data.name,
        description: data.description || '',
        parent_id: data.parent_id || null,
      })
      addCollection(collection)
      setShowCreate(false)
      reset()
      addToast('Collection created', 'success')
    } catch (err) {
      addToast('Failed to create collection', 'error')
    }
  }

  const iconSize = sidebarCollapsed ? 22 : 20

  return (
    <aside className={cn('sidebar', sidebarCollapsed && 'sidebar-collapsed')}>
      <nav className="sidebar-nav">
        {SIDEBAR_NAV.map((item) => (
          <NavLink
            key={item.id}
            to={item.path}
            className={({ isActive }) =>
              cn('sidebar-link', isActive && 'sidebar-link-active')
            }
          >
            <item.icon size={iconSize} />
            {!sidebarCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {!sidebarCollapsed && (
        <>
          <div className="sidebar-divider" />
          <div className="sidebar-section">
            <div className="sidebar-section-header">
              <h3 className="sidebar-section-title">Collections</h3>
              <button className="sidebar-section-add" aria-label="Add collection" onClick={() => setShowCreate(true)}>
                <Plus size={14} />
              </button>
            </div>
            {treeData.length > 0 && <TreeView data={treeData} />}
          </div>
          <div className="sidebar-divider" />
          <div className="sidebar-bottom">
            <div className="sidebar-storage">
              <div className="sidebar-storage-header">
                <HardDrive size={16} />
                <span>Storage</span>
              </div>
              <div className="sidebar-storage-bar">
                <div className="sidebar-storage-fill" style={{ '--fill-width': `${storagePercent}%` }} />
              </div>
              <p className="sidebar-storage-text">{usedStorage.toFixed(1)}GB / {totalStorage}GB ({storagePercent}%)</p>
            </div>
            <div className="sidebar-upgrade">
              <Star size={16} />
              <div>
                <p className="sidebar-upgrade-title">Upgrade to Pro</p>
                <p className="sidebar-upgrade-desc">Unlimited storage</p>
              </div>
            </div>
            <NavLink to="/settings" className="sidebar-settings">
              <Settings size={18} />
              <span>Settings</span>
            </NavLink>
          </div>
        </>
      )}

      <button className="sidebar-toggle" onClick={toggleSidebar}>
        {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <Dialog
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Collection"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button variant="primary" type="submit" form="collection-form">Create</Button>
          </>
        }
      >
        <form id="collection-form" onSubmit={handleSubmit(handleCreate)} className="bookmark-form">
          <Input label="Name" placeholder="Collection name" error={errors.name?.message} {...register('name', { required: 'Name is required' })} />
          <Input label="Description" placeholder="Optional description" {...register('description')} />
          <Select label="Parent Collection" options={parentOptions} {...register('parent_id')} />
        </form>
      </Dialog>
    </aside>
  )
}
