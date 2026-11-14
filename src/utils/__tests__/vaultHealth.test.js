import { describe, it, expect } from 'vitest'
import { analyzeVaultHealth, matchesHealthFilter, formatAge, OLD_AFTER_DAYS } from '../vaultHealth'

const NOW = new Date('2026-11-14T12:00:00.000Z').getTime()
const daysAgo = (days) => new Date(NOW - days * 86400000).toISOString()
const entry = (id, password, score, extra = {}) => ({ id, password, strength: { score }, date: daysAgo(10), ...extra })

describe('analyzeVaultHealth', () => {
  it('skoru 1 ve altındakileri zayıf sayar', () => {
    const { counts, byId } = analyzeVaultHealth([entry('a', 'p1', 0), entry('b', 'p2', 1), entry('c', 'p3', 2)], NOW)
    expect(counts.weak).toBe(2)
    expect(byId.get('a').weak).toBe(true)
    expect(byId.get('c').weak).toBe(false)
  })

  it('aynı şifreyi kullanan her kayıtta tekrar sayısını verir', () => {
    const { counts, byId } = analyzeVaultHealth([
      entry('a', 'ortak', 3), entry('b', 'ortak', 3), entry('c', 'ortak', 3), entry('d', 'tek', 3),
    ], NOW)
    expect(counts.reused).toBe(3)
    expect(byId.get('a').reuseCount).toBe(3)
    expect(byId.get('d').reuseCount).toBe(1)
  })

  it('365 günden eski şifreyi eski sayar, tam sınırdakini saymaz', () => {
    const { counts, byId } = analyzeVaultHealth([
      entry('sinir', 'p1', 3, { date: daysAgo(OLD_AFTER_DAYS) }),
      entry('eski', 'p2', 3, { date: daysAgo(OLD_AFTER_DAYS + 1) }),
    ], NOW)
    expect(counts.old).toBe(1)
    expect(byId.get('sinir').old).toBe(false)
    expect(byId.get('eski').old).toBe(true)
    expect(byId.get('eski').ageDays).toBe(OLD_AFTER_DAYS + 1)
  })

  it('yaşı hesaplarken passwordChangedAt oluşturma tarihinin önüne geçer', () => {
    const { byId } = analyzeVaultHealth([
      entry('a', 'p1', 3, { date: daysAgo(800), passwordChangedAt: daysAgo(5) }),
    ], NOW)
    expect(byId.get('a').ageDays).toBe(5)
    expect(byId.get('a').old).toBe(false)
  })

  it('tarihi geçersiz kaydı eski saymaz', () => {
    const { byId } = analyzeVaultHealth([entry('a', 'p1', 3, { date: 'yok' })], NOW)
    expect(byId.get('a').ageDays).toBeNull()
    expect(byId.get('a').old).toBe(false)
  })

  it('boş kasada sayılar sıfırdır', () => {
    expect(analyzeVaultHealth([], NOW).counts).toEqual({ weak: 0, reused: 0, old: 0 })
  })
})

describe('matchesHealthFilter', () => {
  const issue = { weak: true, reuseCount: 1, old: false }
  it('filtre yoksa her kaydı geçirir', () => {
    expect(matchesHealthFilter(issue, null)).toBe(true)
  })
  it('ilgili soruna göre süzer', () => {
    expect(matchesHealthFilter(issue, 'weak')).toBe(true)
    expect(matchesHealthFilter(issue, 'reused')).toBe(false)
    expect(matchesHealthFilter(issue, 'old')).toBe(false)
    expect(matchesHealthFilter(undefined, 'weak')).toBe(false)
  })
})

describe('formatAge', () => {
  it('yıl ve ay olarak yazar', () => {
    expect(formatAge(400)).toBe('1 yıldır')
    expect(formatAge(800)).toBe('2 yıldır')
    expect(formatAge(200)).toBe('6 aydır')
    expect(formatAge(3)).toBe('1 aydır')
  })
})
