import { useState, useEffect, useRef, useCallback } from 'react'
import {
  ChevronRight, Folder, Film, File,
  ArrowLeft, ArrowRight, ArrowUp, RotateCcw, Home,
} from 'lucide-react'

export function FileExplorer({ onVideoSelect, currentVideo, folderPermission, onRequestPermission, showFileExplorer }) {
  const [rootFolder, setRootFolder] = useState(null)
  const [currentFolder, setCurrentFolder] = useState(null)
  const [currentContents, setCurrentContents] = useState([])
  const [history, setHistory] = useState([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [folderIndex, setFolderIndex] = useState(new Map())
  const scrollRef = useRef(null)

  const scanFolder = useCallback(async (dirHandle, path = '', parentFolder = null) => {
    const folders = []
    const videos = []
    try {
      for await (const entry of dirHandle.values()) {
        const entryPath = path ? `${path}/${entry.name}` : entry.name
        if (entry.kind === 'directory') {
          folders.push({ name: entry.name, path: entryPath, kind: 'directory', handle: entry, parent: parentFolder })
        } else if (entry.name.match(/\.(mp4|webm|mkv|mov|avi|ts)$/i)) {
          videos.push({ name: entry.name, path: entryPath, kind: 'file', handle: entry })
        }
      }
    } catch (err) {
      console.error('Error scanning folder:', err)
    }
    folders.sort((a, b) => a.name.localeCompare(b.name))
    videos.sort((a, b) => a.name.localeCompare(b.name))
    return { folders, videos }
  }, [])

  const buildFolderIndex = useCallback(async (dirHandle, path = '') => {
    const index = new Map()
    try {
      for await (const entry of dirHandle.values()) {
        const entryPath = path ? `${path}/${entry.name}` : entry.name
        if (entry.kind === 'directory') {
          const subIndex = await buildFolderIndex(entry.handle, entryPath)
          index.set(entryPath, subIndex)
        }
      }
    } catch (err) {
      console.error('Error building folder index:', err)
    }
    return index
  }, [])

  useEffect(() => {
    if (folderPermission && showFileExplorer) {
      initializeExplorer()
    }
  }, [folderPermission, showFileExplorer])

  useEffect(() => {
    if (selectedVideo && scrollRef.current) {
      setTimeout(() => {
        const el = document.getElementById(`item-${selectedVideo.path}`)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 100)
    }
  }, [selectedVideo])

  const initializeExplorer = async () => {
    const { folders, videos } = await scanFolder(folderPermission, folderPermission.name)
    const root = {
      name: folderPermission.name,
      path: folderPermission.name,
      handle: folderPermission,
      kind: 'directory',
      parent: null,
    }
    setRootFolder(root)
    setCurrentFolder(root)
    setCurrentContents([...folders, ...videos])
    setHistory([root])
    setHistoryIndex(0)
    const index = await buildFolderIndex(folderPermission, folderPermission.name)
    setFolderIndex(index)
  }

  const navigateToFolder = useCallback(async (folder) => {
    const { folders, videos } = await scanFolder(folder.handle, folder.path, folder)
    setCurrentFolder(folder)
    setCurrentContents([...folders, ...videos])
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(folder)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [history, historyIndex, scanFolder])

  const handleFolderClick = useCallback((item) => {
    if (item.kind === 'directory') {
      navigateToFolder(item)
    }
  }, [navigateToFolder])

  const handleVideoClick = useCallback((item) => {
    setSelectedVideo(item)
    if (onVideoSelect) onVideoSelect(item)
  }, [onVideoSelect])

  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      const prevFolder = history[historyIndex - 1]
      setCurrentFolder(prevFolder)
      scanFolder(prevFolder.handle, prevFolder.path, prevFolder).then(({ folders, videos }) => {
        setCurrentContents([...folders, ...videos])
      })
      setHistoryIndex(historyIndex - 1)
    }
  }, [history, historyIndex, scanFolder])

  const goForward = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextFolder = history[historyIndex + 1]
      setCurrentFolder(nextFolder)
      scanFolder(nextFolder.handle, nextFolder.path, nextFolder).then(({ folders, videos }) => {
        setCurrentContents([...folders, ...videos])
      })
      setHistoryIndex(historyIndex + 1)
    }
  }, [history, historyIndex, scanFolder])

  const goUp = useCallback(() => {
    if (currentFolder?.parent) {
      navigateToFolder(currentFolder.parent)
    }
  }, [currentFolder, navigateToFolder])

  const goHome = useCallback(() => {
    if (rootFolder) navigateToFolder(rootFolder)
  }, [rootFolder, navigateToFolder])

  const refresh = useCallback(async () => {
    if (currentFolder) {
      const { folders, videos } = await scanFolder(currentFolder.handle, currentFolder.path, currentFolder)
      setCurrentContents([...folders, ...videos])
    }
  }, [currentFolder, scanFolder])

  const getBreadcrumbs = useCallback(() => {
    return history.slice(0, historyIndex + 1)
  }, [history, historyIndex])

  if (!folderPermission || !showFileExplorer) return null

  const canGoBack = historyIndex > 0
  const canGoForward = historyIndex < history.length - 1
  const canGoUp = currentFolder?.parent != null
  const breadcrumbs = getBreadcrumbs()

  return (
    <div className="file-explorer-sidebar">
      <div className="file-explorer-toolbar">
        <div className="file-explorer-nav-row">
          <button className="file-explorer-nav-btn" onClick={goBack} disabled={!canGoBack} title="Back">
            <ArrowLeft size={16} />
          </button>
          <button className="file-explorer-nav-btn" onClick={goForward} disabled={!canGoForward} title="Forward">
            <ArrowRight size={16} />
          </button>
          <button className="file-explorer-nav-btn" onClick={goUp} disabled={!canGoUp} title="Up">
            <ArrowUp size={16} />
          </button>
          <button className="file-explorer-nav-btn" onClick={goHome} title="Home">
            <Home size={16} />
          </button>
          <button className="file-explorer-nav-btn" onClick={refresh} title="Refresh">
            <RotateCcw size={16} />
          </button>
        </div>
        <div className="file-explorer-breadcrumb-row">
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.path} className="breadcrumb-item">
              {i > 0 && <ChevronRight size={12} className="breadcrumb-sep" />}
              <button
                className={`breadcrumb-btn ${i === breadcrumbs.length - 1 ? 'current' : ''}`}
                onClick={() => navigateToFolder(crumb)}
              >
                {crumb.name}
              </button>
            </span>
          ))}
        </div>
      </div>
      <div className="file-explorer-content" ref={scrollRef}>
        {currentContents.length === 0 ? (
          <div className="file-explorer-empty">
            <Folder size={32} />
            <p>This folder is empty</p>
          </div>
        ) : (
          currentContents.map((item) => {
            const isSelected = selectedVideo?.path === item.path && currentVideo?.name === item.name
            return (
              <div
                key={item.path}
                id={`item-${item.path}`}
                className={`file-explorer-item ${isSelected ? 'selected' : ''}`}
                onClick={() => item.kind === 'directory' ? handleFolderClick(item) : handleVideoClick(item)}
              >
                <span className="file-explorer-icon">
                  {item.kind === 'directory' ? (
                    <Folder size={16} className="file-icon folder" />
                  ) : item.kind === 'file' ? (
                    <Film size={16} className="file-icon video" />
                  ) : (
                    <File size={16} className="file-icon" />
                  )}
                </span>
                <span className="file-explorer-name">{item.name}</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
