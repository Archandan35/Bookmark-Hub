import { useForm } from 'react-hook-form'
import { Modal } from './Modal'
import { Input, Select, Textarea } from './Input'
import { Button } from './Button'
import { BOOKMARK_TYPES, BOOKMARK_TYPE_CONFIG } from '../constants'
import { X } from 'lucide-react'

export function BookmarkModal({ isOpen, onClose, bookmark, collections, onSave, onDelete }) {
  const isEdit = !!bookmark

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    defaultValues: {
      title: bookmark?.title || '',
      description: bookmark?.description || '',
      url: bookmark?.url || '',
      type: bookmark?.type || 'website',
      collection_id: bookmark?.collection_id || '',
    },
  })

  const selectedType = watch('type')

  const typeOptions = Object.entries(BOOKMARK_TYPE_CONFIG).map(([value, config]) => ({
    value,
    label: config.label,
  }))

  const collectionOptions = [
    { value: '', label: 'No Collection' },
    ...(collections || []).map((c) => ({ value: c.id, label: c.name })),
  ]

  const onSubmit = (data) => {
    onSave?.(data)
    onClose()
    reset()
  }

  const handleDelete = () => {
    onDelete?.(bookmark)
    onClose()
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
            <Button variant="primary" onClick={handleSubmit(onSubmit)}>
              {isEdit ? 'Update' : 'Add Bookmark'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="bookmark-form">
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
          <Input
            label="URL"
            placeholder="https://..."
            error={errors.url?.message}
            {...register('url')}
          />
        )}

        <Select
          label="Collection"
          options={collectionOptions}
          {...register('collection_id')}
        />
      </div>
    </Modal>
  )
}
