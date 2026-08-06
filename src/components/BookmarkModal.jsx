import { useForm } from 'react-hook-form'
import { Modal } from './Modal'
import { Input, Select, Textarea } from './Input'
import { Button } from './Button'
import { BOOKMARK_TYPES, BOOKMARK_TYPE_CONFIG } from '../constants'
import { X, Image, Upload, XCircle } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

const DRAFT_KEY = 'bookmarkhub_add_draft'

function loadDraft() {
  try {
    const saved = localStorage.getItem(DRAFT_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return null
}

function saveDraft(data) {
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(data))
  } catch {}
}

function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY)
  } catch {}
}

export function BookmarkModal({ isOpen, onClose, bookmark, collections, onSave, onDelete }) {
  const isEdit = !!bookmark

  const { register, handleSubmit, formState: { errors }, reset, watch, getValues, setValue } = useForm({
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
  const thumbnail = watch('thumbnail')
  const [uploadedImage, setUploadedImage] = useState('')
  const [showDeleteIcon, setShowDeleteIcon] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (isOpen && !isEdit) {
      const draft = loadDraft()
      if (draft) {
        setValue('title', draft.title || '')
        setValue('description', draft.description || '')
        setValue('url', draft.url || '')
        setValue('type', draft.type || 'website')
        setValue('collection_id', draft.collection_id || '')
        setValue('thumbnail', draft.thumbnail || '')
        if (draft._uploadedImage) setUploadedImage(draft._uploadedImage)
      }
    }
  }, [isOpen, isEdit, setValue])

  useEffect(() => {
    if (!isOpen && !isEdit) {
      const data = getValues()
      saveDraft({ ...data, _uploadedImage: uploadedImage })
    }
  }, [isOpen, getValues, uploadedImage])

  useEffect(() => {
    if (!isEdit) {
      const subscription = watch((data) => {
        saveDraft({ ...data, _uploadedImage: uploadedImage })
      })
      return () => subscription.unsubscribe()
    }
  }, [isEdit, watch, uploadedImage])

  useEffect(() => {
    if (!isEdit) {
      const handleBeforeUnload = () => {
        const data = getValues()
        saveDraft({ ...data, _uploadedImage: uploadedImage })
      }
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          const data = getValues()
          saveDraft({ ...data, _uploadedImage: uploadedImage })
        }
      }
      window.addEventListener('beforeunload', handleBeforeUnload)
      document.addEventListener('visibilitychange', handleVisibilityChange)
      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload)
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }
  }, [isEdit, getValues, uploadedImage])

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
      _uploadedImage: uploadedImage || undefined,
    }
    onSave?.(processedData)
    onClose()
    reset()
    setUploadedImage('')
    clearDraft()
  }

  const handleDelete = () => {
    onDelete?.(bookmark)
    onClose()
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setUploadedImage(event.target?.result || '')
    }
    reader.readAsDataURL(file)
  }

  const getPreviewThumbnail = () => {
    if (uploadedImage) return uploadedImage
    if (thumbnail) return thumbnail
    if (url) {
      try {
        const domain = new URL(url).origin
        return `${domain}/favicon.ico`
      } catch {
        return ''
      }
    }
    return ''
  }

  const removeThumbnail = () => {
    setUploadedImage('')
    setValue('thumbnail', '')
  }

  const previewThumbnail = getPreviewThumbnail()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Bookmark' : 'Add Bookmark'}
      size="md"
      closeOnOverlayClick={false}
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
          <Input
            label="URL"
            placeholder="https://..."
            error={errors.url?.message}
            {...register('url')}
          />
        )}

        <div className="thumbnail-section">
          <label className="input-label">Thumbnail</label>
          <div
            className="thumbnail-upload-area-full"
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onMouseEnter={() => setShowDeleteIcon(true)}
            onMouseLeave={() => setShowDeleteIcon(false)}
            onKeyDown={(e) => { if (e.key === 'Enter') fileInputRef.current?.click() }}
          >
            {previewThumbnail ? (
              <div className="thumbnail-preview-wrapper-full">
                <img src={previewThumbnail} alt="Thumbnail preview" className="thumbnail-preview-img-full" />
                {showDeleteIcon && (
                  <button
                    type="button"
                    className="thumbnail-delete-btn-full"
                    onClick={(e) => { e.stopPropagation(); removeThumbnail() }}
                    aria-label="Remove thumbnail"
                  >
                    <XCircle size={20} />
                  </button>
                )}
              </div>
            ) : (
              <div className="thumbnail-upload-placeholder-full">
                <Upload size={32} />
                <span>Click to upload or paste URL below</span>
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="thumbnail-file-input"
            hidden
          />
          <Input
            label="Or paste thumbnail URL"
            placeholder="https://example.com/image.png"
            {...register('thumbnail')}
          />
          <div className="thumbnail-priority-note">
            <span>Priority: Uploaded image &gt; Thumbnail URL &gt; Favicon from link</span>
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
