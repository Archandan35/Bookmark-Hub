import { useForm } from 'react-hook-form'
import { Modal } from './Modal'
import { Input, Select, Textarea } from './Input'
import { Button } from './Button'
import { BOOKMARK_TYPES, BOOKMARK_TYPE_CONFIG } from '../constants'
import { X, Image, Link } from 'lucide-react'
import { useState } from 'react'

export function BookmarkModal({ isOpen, onClose, bookmark, collections, onSave, onDelete }) {
  const isEdit = !!bookmark

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    defaultValues: {
      title: bookmark?.title || '',
      description: bookmark?.description || '',
      url: bookmark?.url || '',
      type: bookmark?.type || 'website',
      collection_id: bookmark?.collection_id || '',
      thumbnail: bookmark?.thumbnail || '',
    },
  })

  const selectedType = watch('type')
  const url = watch('url')
  const [thumbnailPreview, setThumbnailPreview] = useState(bookmark?.thumbnail || '')

  const typeOptions = Object.entries(BOOKMARK_TYPE_CONFIG).map(([value, config]) => ({
    value,
    label: config.label,
  }))

  const collectionOptions = [
    { value: '', label: 'No Collection' },
    ...(collections || []).map((c) => ({ value: c.id, label: c.name })),
  ]

  const onSubmit = (data) => {
    const processedData = {
      ...data,
      collection_id: data.collection_id || null,
      thumbnail: data.thumbnail || thumbnailPreview || '',
    }
    onSave?.(processedData)
    onClose()
    reset()
    setThumbnailPreview('')
  }

  const handleDelete = () => {
    onDelete?.(bookmark)
    onClose()
  }

  const fetchThumbnail = () => {
    if (url) {
      try {
        const domain = new URL(url).origin
        setThumbnailPreview(`${domain}/favicon.ico`)
      } catch {
        setThumbnailPreview('')
      }
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Bookmark' : 'Add Bookmark'}
      size="md"
      footer={
        <div className="modal-footer-actions">
          {isEdit && (
            <Button variant="danger" onClick={handleDelete}>
              Delete
            </Button>
          )}
          <div className="modal-footer-right">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button variant="primary" type="submit" form="bookmark-form">
              {isEdit ? 'Update' : 'Add Bookmark'}
            </Button>
          </div>
        </div>
      }
    >
      <form id="bookmark-form" onSubmit={handleSubmit(onSubmit)} className="bookmark-form">
        <div className="bookmark-form-type-selector">
          {Object.entries(BOOKMARK_TYPE_CONFIG).map(([type, config]) => (
            <button
              key={type}
              type="button"
              className={`type-option ${selectedType === type ? 'active' : ''}`}
              onClick={() => reset({ ...watch(), type })}
              style={{ '--type-color': config.color }}
            >
              <span className="type-option-label">{config.label}</span>
            </button>
          ))}
        </div>

        <Input
          label="Title"
          placeholder="Enter bookmark title"
          error={errors.title?.message}
          {...register('title', { required: 'Title is required' })}
        />

        <Textarea
          label="Description"
          placeholder="Add a description (optional)"
          {...register('description')}
        />

        {(selectedType === BOOKMARK_TYPES.WEBSITE || selectedType === BOOKMARK_TYPES.VIDEO || selectedType === BOOKMARK_TYPES.AUDIO || selectedType === BOOKMARK_TYPES.PDF) && (
          <div className="input-group">
            <div className="input-with-fetch">
              <Input
                label="URL"
                placeholder="https://..."
                error={errors.url?.message}
                {...register('url')}
              />
              {url && (
                <button type="button" className="fetch-thumbnail-btn" onClick={fetchThumbnail} aria-label="Fetch thumbnail">
                  <Link size={14} />
                </button>
              )}
            </div>
          </div>
        )}

        <div className="thumbnail-section">
          <label className="input-label">Thumbnail</label>
          <div className="thumbnail-input-row">
            <input
              type="text"
              className="input thumbnail-input"
              placeholder="Paste image URL or fetch from link"
              {...register('thumbnail')}
            />
            {thumbnailPreview || watch('thumbnail') ? (
              <div className="thumbnail-preview">
                <img src={thumbnailPreview || watch('thumbnail')} alt="Thumbnail" />
              </div>
            ) : (
              <div className="thumbnail-placeholder">
                <Image size={24} />
              </div>
            )}
          </div>
        </div>

        <Select
          label="Collection"
          options={collectionOptions}
          {...register('collection_id')}
        />
      </form>
    </Modal>
  )
}
