import { useState } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '../utils/helpers'

export function TreeNode({ node, level = 0, onSelect, selectedId }) {
  const [expanded, setExpanded] = useState(false)
  const hasChildren = node.children && node.children.children?.length > 0

  return (
    <div className="tree-node">
      <div
        className={cn('tree-node-content', selectedId === node.id && 'tree-node-active')}
        style={{ '--node-padding': `${level * 16 + 8}px` }}
        onClick={() => onSelect?.(node)}
      >
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
      {expanded && node.children && (
        <div className="tree-node-children">
          {node.children.children?.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function TreeView({ data, onSelect, selectedId }) {
  return (
    <div className="tree-view">
      {data.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          onSelect={onSelect}
          selectedId={selectedId}
        />
      ))}
    </div>
  )
}
