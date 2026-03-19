import { useState, useCallback } from 'react'

const STORAGE_KEY = 'passgen_history'

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
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
      const next = [...entries, ...prev]
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
