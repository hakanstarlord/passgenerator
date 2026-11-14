import { useState, useCallback, useEffect, useRef } from 'react'
import { EMPTY_STATE, loadRateLimitState, saveRateLimitState, stateAfterFailure } from '../utils/unlockRateLimit'

// Deneme sayacı localStorage'da kalıcıdır; uygulamayı yeniden başlatmak bekleme süresini sıfırlamaz.
export default function useUnlockRateLimit() {
  const [state, setState] = useState(() => loadRateLimitState(localStorage))
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
          saveRateLimitState(localStorage, next)
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
    const next = stateAfterFailure(state, Date.now())
    setState(next)
    saveRateLimitState(localStorage, next)
  }, [state])

  const recordSuccess = useCallback(() => {
    const next = { ...EMPTY_STATE }
    setState(next)
    saveRateLimitState(localStorage, next)
  }, [])

  return {
    canAttempt,
    remainingTime,
    failedAttempts: state.failedAttempts,
    recordFailure,
    recordSuccess,
  }
}
