import { describe, it, expect } from 'vitest'
import { getMasterPasswordProblem, MIN_MASTER_PASSWORD_LENGTH } from '../masterPassword'

describe('getMasterPasswordProblem', () => {
  it('asgari uzunluk 12 karakterdir', () => {
    expect(MIN_MASTER_PASSWORD_LENGTH).toBe(12)
  })

  it('kısa ama çeşitli şifreyi uzunluk nedeniyle reddeder', () => {
    expect(getMasterPasswordProblem('Abcd1!')).toBe('En az 12 karakter olmalıdır (şu an 6).')
    expect(getMasterPasswordProblem('Abcd1!xyz9#')).toBe('En az 12 karakter olmalıdır (şu an 11).')
  })

  it('boş şifreyi reddeder', () => {
    expect(getMasterPasswordProblem('')).toBe('En az 12 karakter olmalıdır (şu an 0).')
    expect(getMasterPasswordProblem(undefined)).toBe('En az 12 karakter olmalıdır (şu an 0).')
  })

  it('yeterince uzun ama zayıf şifreyi güç nedeniyle reddeder', () => {
    expect(getMasterPasswordProblem('abcdefghijkl')).toMatch(/En az "Orta" güçte/)
    expect(getMasterPasswordProblem('aaaaaaaaaaaaaaaa')).toMatch(/En az "Orta" güçte/)
  })

  it('güçlü şifreyi ve birkaç kelimelik cümleyi kabul eder', () => {
    expect(getMasterPasswordProblem('Xk9#mP2$vL7!')).toBeNull()
    expect(getMasterPasswordProblem('Mavi deniz kuşu uçar')).toBeNull()
  })
})
