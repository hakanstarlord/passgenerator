import { describe, it, expect } from 'vitest'
import {
  RATE_LIMIT_KEY,
  FAILURE_RESET_MS,
  EMPTY_STATE,
  loadRateLimitState,
  saveRateLimitState,
  stateAfterFailure,
} from '../unlockRateLimit'

const NOW = new Date('2026-11-14T12:00:00.000Z').getTime()

function createStorage(initial = {}) {
  const data = { ...initial }
  return {
    data,
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => { data[key] = String(value) },
  }
}

function failTimes(count, now = NOW) {
  let state = { ...EMPTY_STATE }
  for (let i = 0; i < count; i++) state = stateAfterFailure(state, now)
  return state
}

describe('stateAfterFailure', () => {
  it('4 başarısızlıkta bekleme yok', () => {
    const state = failTimes(4)
    expect(state.failedAttempts).toBe(4)
    expect(state.lockedUntil).toBeNull()
    expect(state.lastFailureAt).toBe(NOW)
  })

  it('5. başarısızlıkta 30 sn bekleme', () => {
    expect(failTimes(5).lockedUntil).toBe(NOW + 30 * 1000)
  })

  it('10. ve sonraki başarısızlıklarda 5 dk bekleme', () => {
    expect(failTimes(10).lockedUntil).toBe(NOW + 5 * 60 * 1000)
    expect(failTimes(11).lockedUntil).toBe(NOW + 5 * 60 * 1000)
  })
})

describe('loadRateLimitState', () => {
  it('kayıt yoksa boş durum döner', () => {
    expect(loadRateLimitState(createStorage(), NOW)).toEqual(EMPTY_STATE)
  })

  it('kaydedilen durumu yeniden okur (uygulama yeniden başlatılınca korunur)', () => {
    const storage = createStorage()
    const state = failTimes(5)
    saveRateLimitState(storage, state)
    expect(loadRateLimitState(storage, NOW + 1000)).toEqual(state)
  })

  it('24 saat başarısızlık olmazsa sayaç sıfırlanır', () => {
    const storage = createStorage()
    saveRateLimitState(storage, failTimes(4))
    expect(loadRateLimitState(storage, NOW + FAILURE_RESET_MS - 1).failedAttempts).toBe(4)
    expect(loadRateLimitState(storage, NOW + FAILURE_RESET_MS + 1)).toEqual(EMPTY_STATE)
  })

  it('bekleme süresi devam ediyorsa sıfırlamaz', () => {
    const storage = createStorage()
    const old = NOW - FAILURE_RESET_MS - 1000
    saveRateLimitState(storage, { failedAttempts: 10, lockedUntil: NOW + 60000, lastFailureAt: old })
    expect(loadRateLimitState(storage, NOW).failedAttempts).toBe(10)
  })

  it('saat geri alınmışsa bekleme en fazla 5 dk olur', () => {
    const storage = createStorage()
    saveRateLimitState(storage, { failedAttempts: 10, lockedUntil: NOW + 3 * 60 * 60 * 1000, lastFailureAt: NOW })
    expect(loadRateLimitState(storage, NOW).lockedUntil).toBe(NOW + 5 * 60 * 1000)
  })

  it('süresi dolmuş beklemeyi null olarak okur', () => {
    const storage = createStorage()
    saveRateLimitState(storage, failTimes(5))
    const state = loadRateLimitState(storage, NOW + 31 * 1000)
    expect(state.lockedUntil).toBeNull()
    expect(state.failedAttempts).toBe(5)
  })

  it('bozuk veya yanlış tipte kaydı boş durum olarak okur', () => {
    const bad = ['bozuk {{{', '"metin"', JSON.stringify({ failedAttempts: -1 }), JSON.stringify({ failedAttempts: 'üç' }), JSON.stringify({ failedAttempts: 2, lockedUntil: 'yarın' })]
    for (const raw of bad) {
      expect(loadRateLimitState(createStorage({ [RATE_LIMIT_KEY]: raw }), NOW)).toEqual(EMPTY_STATE)
    }
  })

  it('eski oturum biçimini (lastFailureAt yok) okur', () => {
    const storage = createStorage({ [RATE_LIMIT_KEY]: JSON.stringify({ failedAttempts: 3, lockedUntil: null }) })
    expect(loadRateLimitState(storage, NOW)).toEqual({ failedAttempts: 3, lockedUntil: null, lastFailureAt: null })
  })
})

describe('saveRateLimitState', () => {
  it('depolama hata verirse çökmez', () => {
    const storage = { setItem: () => { throw new Error('dolu') } }
    expect(() => saveRateLimitState(storage, failTimes(1))).not.toThrow()
  })
})
