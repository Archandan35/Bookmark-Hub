import { useState, useCallback } from 'react'

export function useFileSystem() {
  const [folderHandle, setFolderHandle] = useState(null)
  const [folderName, setFolderName] = useState('')
  const [files, setFiles] = useState([])
  const [permission, setPermission] = useState('prompt')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const isSupported = typeof window !== 'undefined' && 'showDirectoryPicker' in window

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      setError('File System Access API is not supported in this browser.')
      return false
    }

    try {
      setLoading(true)
      setError(null)
      const handle = await window.showDirectoryPicker({ mode: 'read' })
      setFolderHandle(handle)
      setFolderName(handle.name)

      const perm = await handle.queryPermission({ mode: 'read' })
      setPermission(perm)

      if (perm === 'granted') {
        await readDirectory(handle)
      }

      return true
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to access folder')
      }
      return false
    } finally {
      setLoading(false)
    }
  }, [isSupported])

  const readDirectory = async (handle) => {
    const entries = []
    try {
      for await (const [name, entry] of handle.entries()) {
        if (entry.kind === 'file') {
          const file = await entry.getFile()
          entries.push({
            name,
            kind: 'file',
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            handle: entry,
          })
        } else if (entry.kind === 'directory') {
          entries.push({
            name,
            kind: 'directory',
            handle: entry,
          })
        }
      }
      setFiles(entries.sort((a, b) => {
        if (a.kind === 'directory' && b.kind !== 'directory') return -1
        if (a.kind !== 'directory' && b.kind === 'directory') return 1
        return a.name.localeCompare(b.name)
      }))
    } catch (err) {
      setError('Failed to read directory: ' + err.message)
    }
  }

  const refresh = useCallback(async () => {
    if (folderHandle) {
      setLoading(true)
      await readDirectory(folderHandle)
      setLoading(false)
    }
  }, [folderHandle])

  const validateFolder = useCallback(async (expectedName) => {
    if (!folderHandle) return { valid: false, error: 'No folder selected' }
    if (folderHandle.name !== expectedName) {
      return {
        valid: false,
        error: `Selected folder does not match. Expected: ${expectedName}, Selected: ${folderHandle.name}`,
      }
    }
    return { valid: true }
  }, [folderHandle])

  const getFile = useCallback(async (fileName) => {
    if (!folderHandle) return null
    try {
      const fileHandle = await folderHandle.getFileHandle(fileName)
      return await fileHandle.getFile()
    } catch (err) {
      setError(`File not found: ${fileName}`)
      return null
    }
  }, [folderHandle])

  const clearFolder = useCallback(() => {
    setFolderHandle(null)
    setFolderName('')
    setFiles([])
    setPermission('prompt')
    setError(null)
  }, [])

  return {
    folderHandle,
    folderName,
    files,
    permission,
    error,
    loading,
    isSupported,
    requestPermission,
    refresh,
    validateFolder,
    getFile,
    clearFolder,
  }
}
