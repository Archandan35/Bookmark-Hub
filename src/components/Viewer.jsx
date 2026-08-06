import { useState } from 'react'
import { X, ZoomIn, ZoomOut, RotateCw, Download, Maximize, Minimize, FileText } from 'lucide-react'
import { Button } from './Button'

export function Viewer({ file, onClose }) {
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)

  const handleZoomIn = () => setZoom((z) => Math.min(200, z + 25))
  const handleZoomOut = () => setZoom((z) => Math.max(25, z - 25))
  const handleRotate = () => setRotation((r) => (r + 90) % 360)

  if (!file) return null

  const isImage = file.type === 'image' || file.type?.startsWith('image/')
  const isPdf = file.type === 'pdf' || file.url?.endsWith('.pdf')

  return (
    <div className={`viewer ${fullscreen ? 'viewer-fullscreen' : ''}`}>
      <div className="viewer-toolbar">
        <span className="viewer-filename">{file.title || file.name}</span>
        <div className="viewer-actions">
          <Button variant="ghost" size="icon" onClick={handleZoomOut} aria-label="Zoom out">
            <ZoomOut size={18} />
          </Button>
          <span className="viewer-zoom">{zoom}%</span>
          <Button variant="ghost" size="icon" onClick={handleZoomIn} aria-label="Zoom in">
            <ZoomIn size={18} />
          </Button>
          {isImage && (
            <Button variant="ghost" size="icon" onClick={handleRotate} aria-label="Rotate">
              <RotateCw size={18} />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={() => setFullscreen(!fullscreen)} aria-label="Toggle fullscreen">
            {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </Button>
          {file.url && (
            <a href={file.url} download target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon" aria-label="Download">
                <Download size={18} />
              </Button>
            </a>
          )}
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close viewer">
            <X size={18} />
          </Button>
        </div>
      </div>
      <div className="viewer-content">
        <div
          className="viewer-preview"
          style={{ transform: `scale(${zoom / 100}) rotate(${rotation}deg)` }}
        >
          {isImage ? (
            <img src={file.url} alt={file.title || file.name} />
          ) : isPdf ? (
            <div className="viewer-pdf">
              <iframe
                src={file.url}
                title={file.title || file.name}
                width="100%"
                height="100%"
                style={{ border: 'none', minHeight: '500px' }}
              />
            </div>
          ) : (
            <div className="viewer-placeholder">
              <FileText size={48} />
              <p>Preview not available</p>
              <p className="viewer-placeholder-name">{file.title || file.name}</p>
              {file.url && (
                <a href={file.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ marginTop: '16px' }}>
                  Open File
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
