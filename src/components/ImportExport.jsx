import { useRef } from 'react'
import { Download, Upload, FileJson, FileText } from 'lucide-react'
import { Button } from './Button'
import { useToast } from './Toast'
import { cn } from '../utils/helpers'

export function ImportExport({ onImport, exportData, exportFilename = 'bookmarks', className }) {
  const fileRef = useRef(null)
  const { addToast } = useToast()

  const handleExportJSON = () => {
    try {
      const data = exportData || []
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${exportFilename}.json`
      a.click()
      URL.revokeObjectURL(url)
      addToast(`Exported ${data.length} bookmarks`, 'success')
    } catch (err) {
      addToast('Export failed', 'error')
    }
  }

  const handleExportCSV = () => {
    try {
      const data = exportData || []
      if (data.length === 0) {
        addToast('No data to export', 'warning')
        return
      }
      const headers = Object.keys(data[0]).join(',')
      const rows = data.map((item) =>
        Object.values(item).map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')
      )
      const csv = [headers, ...rows].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${exportFilename}.csv`
      a.click()
      URL.revokeObjectURL(url)
      addToast(`Exported ${data.length} bookmarks`, 'success')
    } catch (err) {
      addToast('Export failed', 'error')
    }
  }

  const handleImport = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result
        if (file.name.endsWith('.json')) {
          const data = JSON.parse(text)
          const items = Array.isArray(data) ? data : [data]
          onImport?.(items)
          addToast(`Imported ${items.length} bookmarks`, 'success')
        } else {
          addToast('Only JSON files supported', 'error')
        }
      } catch (err) {
        addToast('Invalid file format', 'error')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className={cn('import-export', className)}>
      <Button variant="ghost" size="sm" onClick={() => fileRef.current?.click()}>
        <Upload size={14} /> Import
      </Button>
      <Button variant="ghost" size="sm" onClick={handleExportJSON}>
        <FileJson size={14} /> JSON
      </Button>
      <Button variant="ghost" size="sm" onClick={handleExportCSV}>
        <FileText size={14} /> CSV
      </Button>
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        className="upload-input"
        hidden
      />
    </div>
  )
}
