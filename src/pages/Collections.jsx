import { useState, useEffect } from 'react'
import { FolderOpen, Plus, MoreVertical, Edit, Trash2, Copy } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { EmptyState } from '../components/EmptyState'
import { Dropdown } from '../components/Dropdown'
import { Dialog } from '../components/Dialog'
import { Input } from '../components/Input'
import { useBookmarkStore, useAuthStore } from '../hooks/useStore'
import { CollectionService } from '../services/CollectionService'
import { useToast } from '../components/Toast'
import { useForm } from 'react-hook-form'

export function Collections() {
  const { user } = useAuthStore()
  const { collections, setCollections, addCollection, updateCollection, removeCollection } = useBookmarkStore()
  const { addToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  useEffect(() => {
    loadCollections()
  }, [user])

  const loadCollections = async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await CollectionService.getAll(user.id)
      setCollections(data)
    } catch (err) {
      console.error('Failed to load collections:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (data) => {
    if (!user) return
    try {
      const collection = await CollectionService.create(user.id, data)
      addCollection(collection)
      setShowCreate(false)
      reset()
      addToast('Collection created', 'success')
    } catch (err) {
      addToast('Failed to create collection', 'error')
    }
  }

  const handleEdit = async (data) => {
    if (!editing) return
    try {
      const updated = await CollectionService.update(editing.id, data)
      updateCollection(editing.id, updated)
      setEditing(null)
      reset()
      addToast('Collection updated', 'success')
    } catch (err) {
      addToast('Failed to update collection', 'error')
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    try {
      await CollectionService.delete(deleteConfirm.id)
      removeCollection(deleteConfirm.id)
      setDeleteConfirm(null)
      addToast('Collection deleted', 'success')
    } catch (err) {
      addToast('Failed to delete collection', 'error')
    }
  }

  const handleDuplicate = async (collection) => {
    if (!user) return
    try {
      const duplicate = await CollectionService.duplicate(collection.id)
      if (duplicate) {
        addCollection(duplicate)
        addToast('Collection duplicated', 'success')
      }
    } catch (err) {
      addToast('Failed to duplicate', 'error')
    }
  }

  const openEdit = (collection) => {
    setEditing(collection)
    reset({ name: collection.name, description: collection.description })
  }

  const getMenuItems = (collection) => [
    { label: 'Edit', icon: Edit, onClick: () => openEdit(collection) },
    { label: 'Duplicate', icon: Copy, onClick: () => handleDuplicate(collection) },
    { divider: true },
    { label: 'Delete', icon: Trash2, onClick: () => setDeleteConfirm(collection) },
  ]

  return (
    <div className="page collections-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Collections</h1>
          <p className="page-subtitle">{collections.length} collections</p>
        </div>
        <Button variant="primary" size="sm" onClick={() => { setShowCreate(true); reset() }}>
          <Plus size={16} /> New Collection
        </Button>
      </div>

      {loading ? (
        <div className="collections-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card skeleton-card">
              <div className="card-body">
                <div className="skeleton skeleton-title" />
                <div className="skeleton skeleton-text" />
              </div>
            </div>
          ))}
        </div>
      ) : collections.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No collections yet"
          description="Create your first collection to organize your bookmarks"
          action={() => setShowCreate(true)}
          actionLabel="Create Collection"
        />
      ) : (
        <div className="collections-grid">
          {collections.map((collection) => (
            <Card key={collection.id} hover className="collection-card">
              <div className="collection-card-header">
                <div className="collection-card-icon" style={{ '--icon-bg': `${collection.color || '#5B3FD6'}15`, '--icon-color': collection.color || '#5B3FD6' }}>
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
              <p className="collection-card-desc">{collection.description || 'No description'}</p>
              <div className="collection-card-footer">
                <span className="collection-card-count">{collection.bookmark_count || 0} items</span>
                <span className="collection-card-updated">
                  {collection.updated_at ? new Date(collection.updated_at).toLocaleDateString() : 'Just created'}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Collection"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit(handleCreate)}>Create</Button>
          </>
        }
      >
        <div className="bookmark-form">
          <Input label="Name" placeholder="Collection name" error={errors.name?.message} {...register('name', { required: 'Name is required' })} />
          <Input label="Description" placeholder="Optional description" {...register('description')} />
        </div>
      </Dialog>

      <Dialog
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        title="Edit Collection"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleSubmit(handleEdit)}>Save</Button>
          </>
        }
      >
        <div className="bookmark-form">
          <Input label="Name" placeholder="Collection name" error={errors.name?.message} {...register('name', { required: 'Name is required' })} />
          <Input label="Description" placeholder="Optional description" {...register('description')} />
        </div>
      </Dialog>

      {deleteConfirm && (
        <Dialog
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="Delete Collection"
          footer={
            <>
              <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete}>Delete</Button>
            </>
          }
        >
          <p>Are you sure you want to delete "{deleteConfirm.name}"? This action cannot be undone.</p>
        </Dialog>
      )}
    </div>
  )
}
