import { useState, useEffect, useRef } from 'react'

const INACTIVITY_TIMEOUT = 5 * 60 * 1000
const WARNING_BEFORE = 30 * 1000
const THROTTLE_MS = 1000

export default function useAutoLock(isLocked, lock) {
  const [showWarning, setShowWarning] = useState(false)
  const [remainingSeconds, setRemainingSeconds] = useState(0)
  const lastActivityRef = useRef(Date.now())
  const warningTimerRef = useRef(null)
  const lockTimerRef = useRef(null)
  const countdownRef = useRef(null)
  const throttleRef = useRef(0)
  const lockRef = useRef(lock)
  lockRef.current = lock

  useEffect(() => {
    if (isLocked) {
      clearTimeout(warningTimerRef.current)
      clearTimeout(lockTimerRef.current)
      clearInterval(countdownRef.current)
      setShowWarning(false)
      return
    }

    function clearAllTimers() {
      clearTimeout(warningTimerRef.current)
      clearTimeout(lockTimerRef.current)
      clearInterval(countdownRef.current)
      warningTimerRef.current = null
      lockTimerRef.current = null
      countdownRef.current = null
    }

    function startTimers() {
      clearAllTimers()
      lastActivityRef.current = Date.now()
      setShowWarning(false)

      warningTimerRef.current = setTimeout(() => {
        setShowWarning(true)
        setRemainingSeconds(Math.ceil(WARNING_BEFORE / 1000))
        countdownRef.current = setInterval(() => {
          const elapsed = Date.now() - lastActivityRef.current
          const remaining = Math.max(0, Math.ceil((INACTIVITY_TIMEOUT - elapsed) / 1000))
          setRemainingSeconds(remaining)
        }, 1000)
      }, INACTIVITY_TIMEOUT - WARNING_BEFORE)

      lockTimerRef.current = setTimeout(() => {
        clearAllTimers()
        setShowWarning(false)
        lockRef.current()
      }, INACTIVITY_TIMEOUT)
    }

    function handleActivity() {
      const now = Date.now()
      if (now - throttleRef.current < THROTTLE_MS) return
      throttleRef.current = now
      startTimers()
    }

    startTimers()

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach(event => window.addEventListener(event, handleActivity))
    window.addEventListener('focus', handleActivity)

    return () => {
      events.forEach(event => window.removeEventListener(event, handleActivity))
      window.removeEventListener('focus', handleActivity)
      clearAllTimers()
    }
  }, [isLocked])

  return { showWarning, remainingSeconds }
}
