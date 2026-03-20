import { useState, useCallback } from 'react'

const STORAGE_KEY = 'passgen_history'
const MAX_HISTORY_SIZE = 100
const MAX_AGE_DAYS = 30

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const data = JSON.parse(raw)
    // 30 günden eski kayıtları otomatik temizle
    const cutoff = Date.now() - MAX_AGE_DAYS * 86400000
    const filtered = data.filter((item) => new Date(item.date).getTime() > cutoff)
    if (filtered.length !== data.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    }
    return filtered
  } catch {
    return []
  }
}

function writeStorage(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export default function usePasswordHistory() {
  const [history, setHistory] = useState(readStorage)

  const addToHistory = useCallback((entries) => {
    setHistory((prev) => {
      const next = [...entries, ...prev].slice(0, MAX_HISTORY_SIZE)
      writeStorage(next)
      return next
    })
  }, [])

  const removeFromHistory = useCallback((id) => {
    setHistory((prev) => {
      const next = prev.filter((item) => item.id !== id)
      writeStorage(next)
      return next
    })
  }, [])

  const clearHistory = useCallback(() => {
    writeStorage([])
    setHistory([])
  }, [])

  return { history, addToHistory, removeFromHistory, clearHistory }
}
