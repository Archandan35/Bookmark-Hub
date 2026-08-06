import { useState, useEffect } from 'react'
import {
  FolderOpen, Grid3X3, List, RefreshCw, MoreHorizontal,
  Download, FileText, Loader,
} from 'lucide-react'
import { useAppStore } from '../hooks/useStore'
import { useFileSystem } from '../hooks/useFileSystem'
import { Button } from '../components/Button'
import { Player } from '../components/Player'
import { cn, formatFileSize } from '../utils/helpers'

export function BottomDock() {
  const { bottomDockOpen, setBottomDockOpen } = useAppStore()
  const { files, folderName, loading, isSupported, requestPermission, refresh, error } = useFileSystem()
  const [viewMode, setViewMode] = useState('list')
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileUrl, setFileUrl] = useState(null)

  useEffect(() => {
    if (!selectedFile) {
      setFileUrl(null)
      return
    }

    let objectUrl = null
    const fetchFile = async () => {
      try {
        if (selectedFile?.kind === 'directory') return
        const fileObj = selectedFile.handle
          ? await selectedFile.handle.getFile()
          : selectedFile
        objectUrl = URL.createObjectURL(fileObj)
        setFileUrl(objectUrl)
      } catch (err) {
        console.error('Failed to get file:', err)
      }
    }
    fetchFile()

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [selectedFile])

  const fileName = selectedFile?.name?.toLowerCase() || ''
  const fileExt = fileName.substring(fileName.lastIndexOf('.') + 1)

  const videoExts = ['mp4', 'webm', 'ogg', 'ogv', 'ts', 'm3u8', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'm4v', 'mpg', 'mpeg', '3gp']
  const audioExts = ['mp3', 'wav', 'ogg', 'webm', 'aac', 'flac', 'm4a', 'wma', 'opus']
  const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff', 'tif', 'heic', 'heif', 'avif']
  const pdfExts = ['pdf']
  const subtitleExts = ['srt', 'vtt', 'sub', 'sbv', 'ass', 'ssa', 'idx']
  const textExts = ['txt', 'md', 'json', 'xml', 'csv', 'log', 'ts', 'js', 'jsx', 'tsx', 'css', 'html', 'yaml', 'yml', 'ini', 'cfg']

  const isVideo = selectedFile?.type?.startsWith('video/') || videoExts.includes(fileExt)
  const isAudio = selectedFile?.type?.startsWith('audio/') || audioExts.includes(fileExt)
  const isImage = selectedFile?.type?.startsWith('image/') || imageExts.includes(fileExt)
  const isPdf = pdfExts.includes(fileExt)
  const isSubtitle = subtitleExts.includes(fileExt)
  const isText = textExts.includes(fileExt)

  const getFileIcon = (file) => {
    if (file.kind === 'directory') return '📁'
    const ext = file.name?.toLowerCase().substring(file.name.lastIndexOf('.') + 1)
    if (videoExts.includes(ext)) return '🎥'
    if (audioExts.includes(ext)) return '🎵'
    if (imageExts.includes(ext)) return '🖼️'
    if (pdfExts.includes(ext)) return '📄'
    if (subtitleExts.includes(ext)) return '🈶'
    if (textExts.includes(ext)) return '📝'
    return '📄'
  }

  const renderMediaViewer = () => {
    if (!fileUrl) {
      return (
        <div className="media-viewer-content">
          <div className="media-viewer-placeholder">
            <Loader size={48} className="animate-spin" />
            <p>Loading...</p>
          </div>
        </div>
      )
    }

    if (isVideo || isAudio) {
      return (
        <div className="media-viewer-content">
          <Player src={fileUrl} title={selectedFile.name} onEnded={() => {}} />
        </div>
      )
    }

    if (isImage) {
      return (
        <div className="media-viewer-content">
          <div className="media-viewer-preview">
            <img src={fileUrl} alt={selectedFile.name} className="media-viewer-img" />
          </div>
        </div>
      )
    }

    if (isPdf) {
      return (
        <div className="media-viewer-content">
          <iframe
            src={fileUrl}
            title={selectedFile.name}
            className="media-viewer-pdf"
            width="100%"
            height="100%"
          />
        </div>
      )
    }

    if (isText) {
      return (
        <div className="media-viewer-content">
          <iframe
            src={fileUrl}
            title={selectedFile.name}
            className="media-viewer-text"
            width="100%"
            height="100%"
          />
        </div>
      )
    }

    return (
      <div className="media-viewer-placeholder">
        <FileText size={48} />
        <p>{selectedFile.name}</p>
        <p>Unsupported file type ({fileExt.toUpperCase()})</p>
        {fileUrl && (
          <a href={fileUrl} download={selectedFile.name} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
            Download file
          </a>
        )}
      </div>
    )
  }

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
                    {getFileIcon(file)} {file.name}
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
              {renderMediaViewer()}
              <div className="media-viewer-file-info">
                <span className="media-viewer-file-name">{selectedFile.name}</span>
                {fileUrl && (
                  <a href={fileUrl} download={selectedFile.name} target="_blank" rel="noopener noreferrer" className="media-viewer-download">
                    <Button variant="ghost" size="icon" aria-label="Download">
                      <Download size={16} />
                    </Button>
                  </a>
                )}
              </div>
            </>
          ) : (
            <div className="media-viewer-empty">
              <FolderOpen size={48} />
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
