import { useState, useRef } from 'react'
import { Upload as UploadIcon, X, FileText, CheckCircle } from 'lucide-react'
import { cn, formatFileSize } from '../utils/helpers'

export function Upload({ accept, multiple = false, maxSize = 10 * 1024 * 1024, onUpload, label, className }) {
  const [files, setFiles] = useState([])
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef(null)

  const handleFiles = (fileList) => {
    const newFiles = Array.from(fileList).map((file) => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: file.size > maxSize ? 'error' : 'ready',
      progress: 0,
    }))
    setFiles((prev) => (multiple ? [...prev, ...newFiles] : newFiles))
    onUpload?.(multiple ? [...files, ...newFiles] : newFiles)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files.length) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const removeFile = (id) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  return (
    <div className={cn('upload', className)}>
      {label && <label className="input-label">{label}</label>}
      <div
        className={cn('upload-zone', dragOver && 'upload-zone-dragover')}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setDragOver(false)}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Upload files"
      >
        <UploadIcon size={24} className="upload-icon" />
        <p className="upload-text">Drop files here or click to browse</p>
        <p className="upload-hint">
          {accept ? `Accepted: ${accept}` : 'Any file type'} • Max {formatFileSize(maxSize)}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className="upload-input"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          hidden
        />
      </div>
      {files.length > 0 && (
        <div className="upload-files">
          {files.map((f) => (
            <div key={f.id} className={cn('upload-file', `upload-file-${f.status}`)}>
              <FileText size={16} className="upload-file-icon" />
              <div className="upload-file-info">
                <span className="upload-file-name">{f.name}</span>
                <span className="upload-file-size">{formatFileSize(f.size)}</span>
              </div>
              {f.status === 'ready' && <CheckCircle size={14} className="upload-file-success" />}
              {f.status === 'error' && <span className="upload-file-error">Too large</span>}
              <button className="upload-file-remove" onClick={() => removeFile(f.id)} aria-label={`Remove ${f.name}`}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
