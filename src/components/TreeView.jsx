import { useState } from 'react'
import { ChevronRight, ChevronDown, GripVertical } from 'lucide-react'
import { cn } from '../utils/helpers'

export function TreeNode({ node, level = 0, onSelect, selectedId, onDragStart, onDragOver, onDragEnd, onDrop, dragOverId, draggedItem }) {
  const [expanded, setExpanded] = useState(level < 1)
  const hasChildren = node.children && node.children.length > 0

  return (
    <div className="tree-node">
      <div
        className={cn(
          'tree-node-content',
          selectedId === node.id && 'tree-node-active',
          draggedItem?.id === node.id && 'dragging',
          dragOverId === node.id && 'tree-node-dragover'
        )}
        style={{ '--node-padding': `${level * 16 + 8}px` }}
        onClick={() => onSelect?.(node)}
        draggable
        onDragStart={(e) => onDragStart?.(e, node)}
        onDragOver={(e) => onDragOver?.(e, node)}
        onDragLeave={onDragEnd}
        onDrop={(e) => onDrop?.(e, node)}
      >
        <span className="tree-node-grip" aria-hidden="true">
          <GripVertical size={12} />
        </span>
        {hasChildren ? (
          <button
            className="tree-node-toggle"
            onClick={(e) => {
              e.stopPropagation()
              setExpanded(!expanded)
            }}
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        ) : (
          <span className="tree-node-spacer" />
        )}
        <span className="tree-node-icon" style={{ '--icon-color': node.color || '#5B3FD6' }}>
          {node.icon ? <node.icon size={16} /> : null}
        </span>
        <span className="tree-node-label">{node.name}</span>
        {node.count !== undefined && <span className="tree-node-count">{node.count}</span>}
      </div>
      {expanded && hasChildren && (
        <div className="tree-node-children">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              selectedId={selectedId}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDragEnd={onDragEnd}
              onDrop={onDrop}
              dragOverId={dragOverId}
              draggedItem={draggedItem}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function TreeView({ data, onSelect, selectedId, onReorder }) {
  const [draggedItem, setDraggedItem] = useState(null)
  const [dragOverId, setDragOverId] = useState(null)

  const handleDragStart = (e, item) => {
    setDraggedItem(item)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', item.id)
    if (e.target) e.target.style.opacity = '0.5'
  }

  const handleDragEnd = (e) => {
    if (e.target) e.target.style.opacity = '1'
    setDraggedItem(null)
    setDragOverId(null)
  }

  const handleDragOver = (e, item) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (item.id !== draggedItem?.id) setDragOverId(item.id)
  }

  const handleDrop = (e, targetItem) => {
    e.preventDefault()
    if (draggedItem && draggedItem.id !== targetItem.id) {
      onReorder?.(draggedItem, targetItem)
    }
    setDraggedItem(null)
    setDragOverId(null)
  }

  return (
    <div className="tree-view">
      {data.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          onSelect={onSelect}
          selectedId={selectedId}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onDrop={handleDrop}
          dragOverId={dragOverId}
          draggedItem={draggedItem}
        />
      ))}
    </div>
  )
}
