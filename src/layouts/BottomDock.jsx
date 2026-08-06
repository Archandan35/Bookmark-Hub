import { useState } from 'react'
import {
  FolderOpen, Grid3X3, List, RefreshCw, MoreHorizontal,
  Play, Pause, SkipBack, SkipForward, Volume2, Maximize,
} from 'lucide-react'
import { useAppStore } from '../hooks/useStore'
import { useFileSystem } from '../hooks/useFileSystem'
import { Button } from '../components/Button'
import { cn, formatFileSize } from '../utils/helpers'

export function BottomDock() {
  const { bottomDockOpen, setBottomDockOpen } = useAppStore()
  const { files, folderName, loading, isSupported, requestPermission, refresh, error } = useFileSystem()
  const [viewMode, setViewMode] = useState('list')
  const [selectedFile, setSelectedFile] = useState(null)

  if (!bottomDockOpen) {
    return (
      <button className="bottom-dock-toggle" onClick={() => setBottomDockOpen(true)}>
        <FolderOpen size={16} />
        <span>File Explorer</span>
      </button>
    )
  }

  return (
    <div className="bottom-dock">
      <div className="bottom-dock-left">
        <div className="file-explorer-header">
          <h4 className="file-explorer-title">{folderName || 'File Explorer'}</h4>
          <p className="file-explorer-breadcrumb">
            {folderName ? `📁 ${folderName}` : 'No folder selected'}
          </p>
          <div className="file-explorer-toolbar">
            {isSupported && (
              <Button variant="ghost" size="sm" onClick={requestPermission}>
                <FolderOpen size={14} /> Open Folder
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={refresh} disabled={!folderName}>
              <RefreshCw size={14} />
            </Button>
            <button
              className={cn('view-toggle-btn', viewMode === 'grid' && 'active')}
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 size={14} />
            </button>
            <button
              className={cn('view-toggle-btn', viewMode === 'list' && 'active')}
              onClick={() => setViewMode('list')}
            >
              <List size={14} />
            </button>
            <button className="view-toggle-btn">
              <MoreHorizontal size={14} />
            </button>
          </div>
        </div>
        <div className="file-explorer-content">
          {error && <div className="file-explorer-error">{error}</div>}
          {loading ? (
            <div className="file-explorer-loading">Loading...</div>
          ) : files.length === 0 ? (
            <div className="file-explorer-empty">
              {isSupported ? (
                <p>Click "Open Folder" to browse local files</p>
              ) : (
                <p>File System Access API not supported in this browser</p>
              )}
            </div>
          ) : (
            <div className="file-explorer-files">
              <div className="file-explorer-row header">
                <span>Name</span>
                <span>Type</span>
                <span>Size</span>
              </div>
              {files.map((file) => (
                <div
                  key={file.name}
                  className={cn('file-explorer-row', selectedFile?.name === file.name && 'selected')}
                  onClick={() => setSelectedFile(file)}
                >
                  <span className="file-explorer-name">
                    {file.kind === 'directory' ? '📁' : '📄'} {file.name}
                  </span>
                  <span>{file.kind}</span>
                  <span>{file.size ? formatFileSize(file.size) : '--'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="bottom-dock-right">
        <div className="media-viewer">
          {selectedFile ? (
            <>
              <div className="media-viewer-content">
                <div className="media-viewer-placeholder">
                  <Play size={48} />
                  <p>{selectedFile.name}</p>
                </div>
              </div>
              <div className="media-viewer-controls">
                <div className="media-viewer-progress">
                  <span>00:00</span>
                  <div className="media-viewer-progress-bar">
                    <div className="media-viewer-progress-fill" style={{ '--progress-width': '0%' }} />
                  </div>
                  <span>00:00</span>
                </div>
                <div className="media-viewer-buttons">
                  <button className="media-viewer-btn">
                    <SkipBack size={16} />
                  </button>
                  <button className="media-viewer-btn media-viewer-play">
                    <Play size={20} />
                  </button>
                  <button className="media-viewer-btn">
                    <SkipForward size={16} />
                  </button>
                  <button className="media-viewer-btn">
                    <Volume2 size={16} />
                  </button>
                  <button className="media-viewer-btn">
                    <Maximize size={16} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="media-viewer-empty">
              <p>Select a file to preview</p>
            </div>
          )}
        </div>
      </div>
      <button className="bottom-dock-close" onClick={() => setBottomDockOpen(false)}>
        &times;
      </button>
    </div>
  )
}
