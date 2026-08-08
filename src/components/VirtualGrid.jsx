import { useState, useRef, useEffect, useCallback, memo } from 'react'

export function VirtualGrid({ items, renderItem, minItemWidth = 280, gap = 24, overscan = 3, className }) {
  const containerRef = useRef(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height)
        setContainerWidth(entry.contentRect.width)
      }
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  const columns = Math.max(1, Math.floor((containerWidth + gap) / (minItemWidth + gap)))
  const rowHeight = minItemWidth * 0.75 + gap
  const rowCount = Math.ceil(items.length / columns)
  const totalHeight = rowCount * rowHeight

  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop)
  }, [])

  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan)
  const visibleRows = Math.ceil(containerHeight / rowHeight) + overscan * 2
  const endIndex = Math.min(rowCount, startIndex + visibleRows)

  const visibleItems = []
  for (let row = startIndex; row < endIndex; row++) {
    for (let col = 0; col < columns; col++) {
      const index = row * columns + col
      if (index < items.length) {
        visibleItems.push({
          item: items[index],
          index,
          row,
          col,
          style: {
            position: 'absolute',
            top: row * rowHeight,
            left: `${col * (minItemWidth + gap)}px`,
            width: minItemWidth,
            height: rowHeight - gap,
          },
        })
      }
    }
  }

  return (
    <div
      ref={containerRef}
      className={`virtual-grid ${className || ''}`}
      onScroll={handleScroll}
      style={{ overflowY: 'auto', height: '100%', position: 'relative' }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ item, index, style }) => (
          <div key={item.id || index} style={style}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  )
}

export const MemoCard = memo(function MemoCard({ children }) {
  return <>{children}</>
})
