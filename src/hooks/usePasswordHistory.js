import { useState, useCallback, useEffect, useRef } from 'react'
import { loadHistory, saveHistory, pruneHistory, getSecureBridge } from '../utils/historyStorage'

// Geçmiş diskte safeStorage ile şifreli saklanır (bkz. utils/historyStorage.js).
// Değişiklikler sıraya alınır ve açılıştaki yükleme bitince başlar; böylece hiçbiri kaybolmaz.
export default function usePasswordHistory() {
  const [history, setHistory] = useState([])
  const [isLoaded, setIsLoaded] = useState(false)
  const historyRef = useRef([])
  const queueRef = useRef(Promise.resolve())

  useEffect(() => {
    let active = true
    const loading = loadHistory({ storage: localStorage, ...getSecureBridge() })
      .catch(() => [])
      .then((entries) => {
        if (!active) return
        historyRef.current = entries
        setHistory(entries)
        setIsLoaded(true)
      })
    queueRef.current = loading
    return () => { active = false }
  }, [])

  const mutate = useCallback((updater) => {
    const run = async () => {
      const next = pruneHistory(updater(historyRef.current))
      historyRef.current = next
      setHistory(next)
      try {
        await saveHistory(next, { storage: localStorage, protect: getSecureBridge().protect })
      } catch {
        // Şifreli yazma başarısızsa geçmiş bu oturumda bellekte kalır
      }
    }
    const result = queueRef.current.then(run)
    queueRef.current = result.catch(() => {})
    return result
  }, [])

  const addToHistory = useCallback((entries) => {
    return mutate((prev) => [...entries, ...prev])
  }, [mutate])

  const removeFromHistory = useCallback((id) => {
    return mutate((prev) => prev.filter((item) => item.id !== id))
  }, [mutate])

  const clearHistory = useCallback(() => {
    return mutate(() => [])
  }, [mutate])

  return { history, isLoaded, addToHistory, removeFromHistory, clearHistory }
}
