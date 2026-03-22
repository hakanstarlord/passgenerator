import { useState, useCallback, useEffect, useRef } from 'react'

const STORAGE_KEY = 'passgen_unlock_rate'

const THRESHOLDS = [
  { attempts: 10, cooldown: 300 },
  { attempts: 5, cooldown: 30 },
]

function getStoredState() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveState(state) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export default function useUnlockRateLimit() {
  const [state, setState] = useState(() => {
    return getStoredState() || { failedAttempts: 0, lockedUntil: null }
  })
  const [remainingTime, setRemainingTime] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    function tick() {
      if (state.lockedUntil) {
        const remaining = Math.max(0, Math.ceil((state.lockedUntil - Date.now()) / 1000))
        setRemainingTime(remaining)
        if (remaining <= 0) {
          const next = { ...state, lockedUntil: null }
          setState(next)
          saveState(next)
        }
      } else {
        setRemainingTime(0)
      }
    }

    tick()
    timerRef.current = setInterval(tick, 1000)
    return () => clearInterval(timerRef.current)
  }, [state])

  const canAttempt = remainingTime <= 0

  const recordFailure = useCallback(() => {
    const newAttempts = state.failedAttempts + 1
    let cooldown = 0
    for (const threshold of THRESHOLDS) {
      if (newAttempts >= threshold.attempts) {
        cooldown = threshold.cooldown
        break
      }
    }
    const next = {
      failedAttempts: newAttempts,
      lockedUntil: cooldown > 0 ? Date.now() + cooldown * 1000 : null,
    }
    setState(next)
    saveState(next)
  }, [state.failedAttempts])

  const recordSuccess = useCallback(() => {
    const next = { failedAttempts: 0, lockedUntil: null }
    setState(next)
    saveState(next)
  }, [])

  return {
    canAttempt,
    remainingTime,
    failedAttempts: state.failedAttempts,
    recordFailure,
    recordSuccess,
  }
}
