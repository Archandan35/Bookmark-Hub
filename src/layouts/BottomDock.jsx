import { useState } from 'react'
import {
  FolderOpen, Grid3X3, List, RefreshCw, MoreHorizontal,
  Play, Pause, SkipBack, SkipForward, Volume2, Maximize,
} from 'lucide-react'
import { useAppStore } from '../hooks/useStore'
import { Button } from '../components/Button'
import { cn } from '../utils/helpers'

export function BottomDock() {
  const { bottomDockOpen, setBottomDockOpen } = useAppStore()
  const [viewMode, setViewMode] = useState('list')
  const [selectedFile, setSelectedFile] = useState(null)

  const files = [
    { name: 'Introduction.mp4', type: 'video', size: '45 MB', modified: '2 days ago' },
    { name: 'Components.mp4', type: 'video', size: '62 MB', modified: '2 days ago' },
    { name: 'Hooks.mp4', type: 'video', size: '38 MB', modified: '3 days ago' },
    { name: 'Cheatsheet.pdf', type: 'pdf', size: '2 MB', modified: '1 week ago' },
    { name: 'README.md', type: 'markdown', size: '4 KB', modified: '1 week ago' },
    { name: 'package.json', type: 'code', size: '1 KB', modified: '2 weeks ago' },
    { name: 'index.html', type: 'code', size: '3 KB', modified: '2 weeks ago' },
  ]

  const folders = ['Videos', 'Docs', 'Projects', 'Notes']

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
          <h4 className="file-explorer-title">React Course</h4>
          <p className="file-explorer-breadcrumb">D:\Study\React</p>
          <div className="file-explorer-toolbar">
            <Button variant="ghost" size="sm">New Folder</Button>
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
              <RefreshCw size={14} />
            </button>
            <button className="view-toggle-btn">
              <MoreHorizontal size={14} />
            </button>
          </div>
        </div>
        <div className="file-explorer-content">
          <div className="file-explorer-folders">
            {folders.map((f) => (
              <div key={f} className="file-explorer-folder">
                <FolderOpen size={14} /> {f}
              </div>
            ))}
          </div>
          <div className="file-explorer-files">
            <div className="file-explorer-row header">
              <span>Name</span>
              <span>Type</span>
              <span>Size</span>
              <span>Modified</span>
            </div>
            {files.map((file) => (
              <div
                key={file.name}
                className={cn('file-explorer-row', selectedFile === file.name && 'selected')}
                onClick={() => setSelectedFile(file.name)}
              >
                <span className="file-explorer-name">
                  {file.type === 'video' && '🎬'}
                  {file.type === 'pdf' && '📄'}
                  {file.type === 'markdown' && '📝'}
                  {file.type === 'code' && '💻'}
                  {' '}{file.name}
                </span>
                <span>{file.type}</span>
                <span>{file.size}</span>
                <span>{file.modified}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="bottom-dock-right">
        <div className="media-viewer">
          {selectedFile ? (
            <>
              <div className="media-viewer-content">
                <div className="media-viewer-placeholder">
                  <Play size={48} />
                  <p>{selectedFile}</p>
                </div>
              </div>
              <div className="media-viewer-controls">
                <div className="media-viewer-progress">
                  <span>00:00</span>
                  <div className="media-viewer-progress-bar">
                    <div className="media-viewer-progress-fill" style={{ '--progress-width': '0%' }} />
                  </div>
                  <span>05:32</span>
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
