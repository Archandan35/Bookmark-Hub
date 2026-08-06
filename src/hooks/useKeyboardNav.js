import { useEffect, useCallback } from 'react'

export function useKeyboardNav(shortcuts) {
  const handleKeyDown = useCallback((e) => {
    const { key, ctrlKey, metaKey, altKey, shiftKey } = e

    for (const [combo, handler] of Object.entries(shortcuts)) {
      const parts = combo.split('+')
      const keyName = parts.pop()
      const needsCtrl = parts.includes('Ctrl') || parts.includes('cmd')
      const needsAlt = parts.includes('Alt')
      const needsShift = parts.includes('Shift')

      if (
        key.toLowerCase() === keyName.toLowerCase() &&
        (needsCtrl === (ctrlKey || metaKey)) &&
        (needsAlt === altKey) &&
        (needsShift === shiftKey)
      ) {
        e.preventDefault()
        handler(e)
        return
      }
    }
  }, [shortcuts])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

export function useFocusTrap(ref, isActive) {
  useEffect(() => {
    if (!isActive || !ref.current) return

    const focusableSelectors = [
      'a[href]', 'button:not([disabled])', 'input:not([disabled])',
      'textarea:not([disabled])', 'select:not([disabled])', '[tabindex]:not([tabindex="-1"])',
    ]

    const getFocusableElements = () => {
      if (!ref.current) return []
      return Array.from(ref.current.querySelectorAll(focusableSelectors.join(', ')))
    }

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return
      const focusable = getFocusableElements()
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    const focusable = getFocusableElements()
    if (focusable.length > 0) {
      focusable[0].focus()
    }

    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [ref, isActive])
}
