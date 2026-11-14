// Kasa kilidini açma deneme sınırı. Durum localStorage'da tutulur, böylece uygulamayı
// yeniden başlatmak bekleme süresini ve sayacı sıfırlamaz.

export const RATE_LIMIT_KEY = 'passgen_unlock_rate'
// Son başarısız denemenin üzerinden bu kadar zaman geçtiyse sayaç sıfırdan başlar
export const FAILURE_RESET_MS = 24 * 60 * 60 * 1000
// Büyükten küçüğe: ilk eşleşen eşik uygulanır
export const THRESHOLDS = [
  { attempts: 10, cooldownMs: 5 * 60 * 1000 },
  { attempts: 5, cooldownMs: 30 * 1000 },
]
const MAX_COOLDOWN_MS = THRESHOLDS[0].cooldownMs

export const EMPTY_STATE = Object.freeze({ failedAttempts: 0, lockedUntil: null, lastFailureAt: null })

const isCount = (value) => Number.isInteger(value) && value >= 0
const isTimeOrNull = (value) => value === null || (typeof value === 'number' && Number.isFinite(value))

export function loadRateLimitState(storage, now = Date.now()) {
  let stored
  try {
    stored = JSON.parse(storage.getItem(RATE_LIMIT_KEY))
  } catch {
    return { ...EMPTY_STATE }
  }
  if (!stored || typeof stored !== 'object') return { ...EMPTY_STATE }

  const lockedUntil = stored.lockedUntil ?? null
  const lastFailureAt = stored.lastFailureAt ?? null
  if (!isCount(stored.failedAttempts) || !isTimeOrNull(lockedUntil) || !isTimeOrNull(lastFailureAt)) {
    return { ...EMPTY_STATE }
  }

  const stillLocked = lockedUntil !== null && lockedUntil > now
  if (!stillLocked && lastFailureAt !== null && now - lastFailureAt > FAILURE_RESET_MS) {
    return { ...EMPTY_STATE }
  }

  return {
    failedAttempts: stored.failedAttempts,
    // Saat geri alınmışsa bekleme en uzun eşiği aşmasın
    lockedUntil: stillLocked ? Math.min(lockedUntil, now + MAX_COOLDOWN_MS) : null,
    lastFailureAt,
  }
}

export function stateAfterFailure(state, now = Date.now()) {
  const failedAttempts = state.failedAttempts + 1
  const threshold = THRESHOLDS.find((t) => failedAttempts >= t.attempts)
  return {
    failedAttempts,
    lockedUntil: threshold ? now + threshold.cooldownMs : null,
    lastFailureAt: now,
  }
}

export function saveRateLimitState(storage, state) {
  try {
    storage.setItem(RATE_LIMIT_KEY, JSON.stringify(state))
  } catch {
    // Depolama kullanılamıyorsa sınır bu oturumla sınırlı kalır
  }
}
