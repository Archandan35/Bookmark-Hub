import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { cn } from '../utils/helpers'

export function Pagination({ currentPage, totalPages, onChange, className }) {
  const getVisiblePages = () => {
    const delta = 2
    const range = []
    for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
      range.push(i)
    }
    if (range[0] > 1) {
      if (range[0] > 2) range.unshift('...')
      range.unshift(1)
    }
    if (range[range.length - 1] < totalPages) {
      if (range[range.length - 1] < totalPages - 1) range.push('...')
      range.push(totalPages)
    }
    return range
  }

  if (totalPages <= 1) return null

  return (
    <div className={cn('pagination', className)}>
      <button
        className="pagination-btn pagination-first"
        onClick={() => onChange(1)}
        disabled={currentPage === 1}
        aria-label="First page"
      >
        <ChevronsLeft size={16} />
      </button>
      <button
        className="pagination-btn pagination-prev"
        onClick={() => onChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>
      {getVisiblePages().map((page, i) => (
        <button
          key={i}
          className={cn('pagination-btn pagination-page', page === currentPage && 'pagination-active', page === '...' && 'pagination-dots')}
          onClick={() => typeof page === 'number' && onChange(page)}
          disabled={page === '...'}
          aria-current={page === currentPage ? 'page' : undefined}
        >
          {page}
        </button>
      ))}
      <button
        className="pagination-btn pagination-next"
        onClick={() => onChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
      <button
        className="pagination-btn pagination-last"
        onClick={() => onChange(totalPages)}
        disabled={currentPage === totalPages}
        aria-label="Last page"
      >
        <ChevronsRight size={16} />
      </button>
    </div>
  )
}
