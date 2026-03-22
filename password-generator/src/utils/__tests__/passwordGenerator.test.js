import { describe, it, expect } from 'vitest'
import { generatePassword, calculateStrength, calculateEntropy } from '../passwordGenerator'

describe('generatePassword', () => {
  it('boş karakter setiyle boş string döner', () => {
    const result = generatePassword(16, { uppercase: false, lowercase: false, numbers: false, symbols: false })
    expect(result).toBe('')
  })

  it('istenen uzunlukta şifre üretir', () => {
    const lengths = [4, 8, 16, 32, 64]
    for (const len of lengths) {
      const pw = generatePassword(len, { uppercase: true, lowercase: true, numbers: true, symbols: true })
      expect(pw).toHaveLength(len)
    }
  })

  it('her aktif setten en az 1 karakter içerir', () => {
    for (let i = 0; i < 20; i++) {
      const pw = generatePassword(8, { uppercase: true, lowercase: true, numbers: true, symbols: true })
      expect(pw).toMatch(/[A-Z]/)
      expect(pw).toMatch(/[a-z]/)
      expect(pw).toMatch(/[0-9]/)
      expect(pw).toMatch(/[^a-zA-Z0-9]/)
    }
  })

  it('sadece aktif setlerden karakter kullanır', () => {
    const pwNumbersOnly = generatePassword(20, { uppercase: false, lowercase: false, numbers: true, symbols: false })
    expect(pwNumbersOnly).toMatch(/^[0-9]+$/)

    const pwLettersOnly = generatePassword(20, { uppercase: true, lowercase: true, numbers: false, symbols: false })
    expect(pwLettersOnly).toMatch(/^[a-zA-Z]+$/)
  })

  it('farklı çağrılarda farklı şifreler üretir', () => {
    const charTypes = { uppercase: true, lowercase: true, numbers: true, symbols: true }
    const passwords = new Set(Array.from({ length: 10 }, () => generatePassword(16, charTypes)))
    // 10 çağrıda en az 9 benzersiz olmalı
    expect(passwords.size).toBeGreaterThanOrEqual(9)
  })
})

describe('calculateStrength', () => {
  it('boş şifre için Çok Zayıf döner', () => {
    expect(calculateStrength('').score).toBe(0)
    expect(calculateStrength('').label).toBe('Çok Zayıf')
    expect(calculateStrength(null).score).toBe(0)
  })

  it('kısa şifre düşük skor alır', () => {
    const result = calculateStrength('abc')
    expect(result.score).toBeLessThanOrEqual(1)
  })

  it('uzun ve çeşitli şifre yüksek skor alır', () => {
    const result = calculateStrength('Abc123!@#XyzQwerty')
    expect(result.score).toBeGreaterThanOrEqual(3)
  })

  it('tekrar eden karakterler cezalandırılır', () => {
    const varied = calculateStrength('AbCdEfGh12!@')
    const repeated = calculateStrength('aaaaaaaaaaaa')
    expect(varied.score).toBeGreaterThan(repeated.score)
  })

  it('skor 0-4 arasında sınırlıdır', () => {
    const scores = [
      calculateStrength('a').score,
      calculateStrength('Abc123!@#DefGhiJklMnoPqr').score,
    ]
    for (const s of scores) {
      expect(s).toBeGreaterThanOrEqual(0)
      expect(s).toBeLessThanOrEqual(4)
    }
  })

  it('doğru etiketler döner', () => {
    const labels = ['Çok Zayıf', 'Zayıf', 'Orta', 'Güçlü', 'Çok Güçlü']
    const result = calculateStrength('Test123!@#AbcDefGhiJkl')
    expect(labels).toContain(result.label)
  })
})

describe('calculateEntropy', () => {
  it('boş karakter seti için 0 döner', () => {
    expect(calculateEntropy(16, { uppercase: false, lowercase: false, numbers: false, symbols: false })).toBe(0)
  })

  it('sadece küçük harfler: 16 * log2(26) ≈ 75', () => {
    const entropy = calculateEntropy(16, { uppercase: false, lowercase: true, numbers: false, symbols: false })
    expect(entropy).toBe(Math.floor(16 * Math.log2(26)))
    expect(entropy).toBe(75)
  })

  it('tüm setler aktif: doğru hesaplama', () => {
    // uppercase(26) + lowercase(26) + numbers(10) + symbols(26) = 88
    const charsetSize = 26 + 26 + 10 + 26 // symbols string length
    const entropy = calculateEntropy(16, { uppercase: true, lowercase: true, numbers: true, symbols: true })
    expect(entropy).toBe(Math.floor(16 * Math.log2(charsetSize)))
  })

  it('uzunluk arttıkça entropi artar', () => {
    const charTypes = { uppercase: true, lowercase: true, numbers: true, symbols: true }
    const e8 = calculateEntropy(8, charTypes)
    const e16 = calculateEntropy(16, charTypes)
    const e32 = calculateEntropy(32, charTypes)
    expect(e16).toBeGreaterThan(e8)
    expect(e32).toBeGreaterThan(e16)
  })

  it('daha fazla karakter seti daha yüksek entropi verir', () => {
    const numbersOnly = calculateEntropy(16, { uppercase: false, lowercase: false, numbers: true, symbols: false })
    const allSets = calculateEntropy(16, { uppercase: true, lowercase: true, numbers: true, symbols: true })
    expect(allSets).toBeGreaterThan(numbersOnly)
  })
})
