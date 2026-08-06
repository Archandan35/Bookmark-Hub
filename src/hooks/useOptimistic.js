import { useState, useCallback } from 'react'

export function useOptimistic(initialState) {
  const [state, setState] = useState(initialState)

  const run = useCallback(async (newValue, asyncFn) => {
    const previousValue = state
    setState(newValue)

    try {
      const result = await asyncFn()
      setState(result ?? newValue)
      return result
    } catch (err) {
      setState(previousValue)
      throw err
    }
  }, [state])

  return [state, run, setState]
}

export function useOptimisticList(initialList = []) {
  const [items, setItems] = useState(initialList)

  const add = useCallback((newItem, asyncFn) => {
    const tempId = `temp-${Date.now()}`
    const optimisticItem = { ...newItem, id: tempId, _optimistic: true }
    setItems((prev) => [optimisticItem, ...prev])

    return asyncFn()
      .then((result) => {
        setItems((prev) => prev.map((item) => (item.id === tempId ? { ...result, _optimistic: false } : item)))
        return result
      })
      .catch((err) => {
        setItems((prev) => prev.filter((item) => item.id !== tempId))
        throw err
      })
  }, [])

  const update = useCallback((id, updates, asyncFn) => {
    const previousItems = [...items]
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates, _optimistic: true } : item)))

    return asyncFn()
      .then((result) => {
        setItems((prev) => prev.map((item) => (item.id === id ? { ...result, _optimistic: false } : item)))
        return result
      })
      .catch((err) => {
        setItems(previousItems)
        throw err
      })
  }, [items])

  const remove = useCallback((id, asyncFn) => {
    const previousItems = [...items]
    setItems((prev) => prev.filter((item) => item.id !== id))

    return asyncFn().catch((err) => {
      setItems(previousItems)
      throw err
    })
  }, [items])

  return { items, setItems, add, update, remove }
}
