import { useState, useCallback } from 'react'

export function useDragDrop(onReorder) {
  const [draggedItem, setDraggedItem] = useState(null)
  const [dragOverItem, setDragOverItem] = useState(null)

  const handleDragStart = useCallback((e, item) => {
    setDraggedItem(item)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', item.id)
    if (e.target) {
      e.target.style.opacity = '0.5'
    }
  }, [])

  const handleDragEnd = useCallback((e) => {
    if (e.target) {
      e.target.style.opacity = '1'
    }
    setDraggedItem(null)
    setDragOverItem(null)
  }, [])

  const handleDragOver = useCallback((e, item) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (item.id !== draggedItem?.id) {
      setDragOverItem(item)
    }
  }, [draggedItem])

  const handleDragLeave = useCallback(() => {
    setDragOverItem(null)
  }, [])

  const handleDrop = useCallback((e, targetItem) => {
    e.preventDefault()
    if (draggedItem && draggedItem.id !== targetItem.id) {
      onReorder?.(draggedItem, targetItem)
    }
    setDraggedItem(null)
    setDragOverItem(null)
  }, [draggedItem, onReorder])

  return {
    draggedItem,
    dragOverItem,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  }
}
