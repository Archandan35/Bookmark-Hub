import { useState } from 'react'
import { X, ZoomIn, ZoomOut, RotateCw, Download, Maximize, Minimize } from 'lucide-react'
import { Button } from './Button'

export function Viewer({ file, onClose }) {
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)

  const handleZoomIn = () => setZoom((z) => Math.min(200, z + 25))
  const handleZoomOut = () => setZoom((z) => Math.max(25, z - 25))
  const handleRotate = () => setRotation((r) => (r + 90) % 360)

  if (!file) return null

  return (
    <div className={`viewer ${fullscreen ? 'viewer-fullscreen' : ''}`}>
      <div className="viewer-toolbar">
        <span className="viewer-filename">{file.name}</span>
        <div className="viewer-actions">
          <Button variant="ghost" size="icon" onClick={handleZoomOut} aria-label="Zoom out">
            <ZoomOut size={18} />
          </Button>
          <span className="viewer-zoom">{zoom}%</span>
          <Button variant="ghost" size="icon" onClick={handleZoomIn} aria-label="Zoom in">
            <ZoomIn size={18} />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleRotate} aria-label="Rotate">
            <RotateCw size={18} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setFullscreen(!fullscreen)} aria-label="Toggle fullscreen">
            {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
          </Button>
          <Button variant="ghost" size="icon" aria-label="Download">
            <Download size={18} />
          </Button>
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
          {file.type?.startsWith('image/') ? (
            <img src={file.url} alt={file.name} />
          ) : (
            <div className="viewer-placeholder">
              <p>Preview not available</p>
              <p className="viewer-placeholder-name">{file.name}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
