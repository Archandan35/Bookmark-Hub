import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

const CACHE_TTL = 5 * 60 * 1000
const DEBOUNCE_MS = 250

function getCacheKey(query, filters) {
  return `${query}:${JSON.stringify(filters)}`
}

function createCache() {
  const cache = new Map()

  return {
    get(key) {
      const entry = cache.get(key)
      if (!entry) return null
      if (Date.now() - entry.timestamp > CACHE_TTL) {
        cache.delete(key)
        return null
      }
      return entry.data
    },
    set(key, data) {
      if (cache.size > 100) {
        const firstKey = cache.keys().next().value
        cache.delete(firstKey)
      }
      cache.set(key, { data, timestamp: Date.now() })
    },
    clear() {
      cache.clear()
    },
  }
}

const searchCache = createCache()

export function useLiveSearch(searchFn, options = {}) {
  const { debounceMs = DEBOUNCE_MS, minChars = 2, enabled = true } = options
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)
  const debounceRef = useRef(null)

  const search = useCallback(async (searchQuery, filters) => {
    if (!enabled) return

    const trimmed = searchQuery.trim()
    if (trimmed.length < minChars) {
      setResults([])
      setLoading(false)
      return
    }

    const cacheKey = getCacheKey(trimmed, filters)
    const cached = searchCache.get(cacheKey)
    if (cached) {
      setResults(cached)
      setLoading(false)
      return
    }

    if (abortRef.current) {
      abortRef.current.abort()
    }
    abortRef.current = new AbortController()

    setLoading(true)
    setError(null)

    try {
      const data = await searchFn(trimmed, { signal: abortRef.current.signal, ...filters })
      searchCache.set(cacheKey, data)
      setResults(data)
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message)
        setResults([])
      }
    } finally {
      setLoading(false)
    }
  }, [searchFn, enabled, minChars])

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      search(query, {})
    }, debounceMs)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query, debounceMs, search])

  const clearCache = useCallback(() => {
    searchCache.clear()
  }, [])

  const clearResults = useCallback(() => {
    setQuery('')
    setResults([])
    setError(null)
  }, [])

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    clearResults,
    clearCache,
    hasResults: results.length > 0,
  }
}

export function useSearchCache() {
  return {
    clear: () => searchCache.clear(),
    size: () => searchCache.cache?.size || 0,
  }
}

export const searchCacheStats = useMemo(() => ({
  hits: 0,
  misses: 0,
}), [])
