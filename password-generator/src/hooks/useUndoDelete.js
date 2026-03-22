import { useState, useCallback, useRef } from 'react'

const UNDO_TIMEOUT = 7000
const MAX_BUFFER = 5

export default function useUndoDelete() {
  const [pendingDeletes, setPendingDeletes] = useState([])
  const timersRef = useRef({})

  const removeFromBuffer = useCallback((id) => {
    if (timersRef.current[id]) {
      clearTimeout(timersRef.current[id].timeout)
      clearInterval(timersRef.current[id].countdown)
      delete timersRef.current[id]
    }
    setPendingDeletes(prev => prev.filter(d => d.item.id !== id))
  }, [])

  const softDelete = useCallback((item) => {
    // Buffer taşması: en eski undo fırsatını kaldır
    setPendingDeletes(prev => {
      if (prev.length >= MAX_BUFFER) {
        const oldest = prev[prev.length - 1]
        if (timersRef.current[oldest.item.id]) {
          clearTimeout(timersRef.current[oldest.item.id].timeout)
          clearInterval(timersRef.current[oldest.item.id].countdown)
          delete timersRef.current[oldest.item.id]
        }
        return [{ item, remainingSeconds: Math.ceil(UNDO_TIMEOUT / 1000) }, ...prev.slice(0, MAX_BUFFER - 1)]
      }
      return [{ item, remainingSeconds: Math.ceil(UNDO_TIMEOUT / 1000) }, ...prev]
    })

    const timeout = setTimeout(() => {
      removeFromBuffer(item.id)
    }, UNDO_TIMEOUT)

    const countdown = setInterval(() => {
      setPendingDeletes(prev =>
        prev.map(d =>
          d.item.id === item.id
            ? { ...d, remainingSeconds: Math.max(0, d.remainingSeconds - 1) }
            : d
        )
      )
    }, 1000)

    timersRef.current[item.id] = { timeout, countdown }
  }, [removeFromBuffer])

  const undoDelete = useCallback((id) => {
    const entry = pendingDeletes.find(d => d.item.id === id)
    if (!entry) return null
    removeFromBuffer(id)
    return entry.item
  }, [pendingDeletes, removeFromBuffer])

  const clearAll = useCallback(() => {
    Object.values(timersRef.current).forEach(({ timeout, countdown }) => {
      clearTimeout(timeout)
      clearInterval(countdown)
    })
    timersRef.current = {}
    setPendingDeletes([])
  }, [])

  return { pendingDeletes, softDelete, undoDelete, clearAll }
}
