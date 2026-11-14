import { describe, it, expect } from 'vitest'
import { normalizeVaultEntry } from '../vaultEntry'
import { calculateStrength } from '../passwordGenerator'

const complete = {
  id: 'abc',
  name: 'Banka',
  password: 'Abc-123-xyz!',
  strength: calculateStrength('Abc-123-xyz!'),
  length: 12,
  charTypes: { uppercase: true, lowercase: true, numbers: true, symbols: false },
  category: 'bank',
  date: '2026-11-14T10:00:00.000Z',
}

describe('normalizeVaultEntry', () => {
  it('tam kaydı değiştirmeden döndürür', () => {
    expect(normalizeVaultEntry(complete)).toEqual(complete)
  })

  it('yalnızca ad ve şifresi olan kaydı tamamlar', () => {
    const result = normalizeVaultEntry({ name: 'Eksik', password: 'Abc-123' })
    expect(result.name).toBe('Eksik')
    expect(result.password).toBe('Abc-123')
    expect(result.length).toBe(7)
    expect(result.strength).toEqual(calculateStrength('Abc-123'))
    expect(result.charTypes).toEqual({ uppercase: true, lowercase: true, numbers: true, symbols: true })
    expect(result.category).toBe('other')
    expect(typeof result.id).toBe('string')
    expect(Number.isNaN(Date.parse(result.date))).toBe(false)
  })

  it('geçersiz charTypes yerine şifreden türetir', () => {
    const result = normalizeVaultEntry({ ...complete, password: '123456', charTypes: { uppercase: 'evet' } })
    expect(result.charTypes).toEqual({ uppercase: false, lowercase: false, numbers: true, symbols: false })
  })

  it('sayı olan şifreyi ve adı metne çevirir', () => {
    const result = normalizeVaultEntry({ name: 2026, password: 123456 })
    expect(result.password).toBe('123456')
    expect(result.name).toBe('2026')
  })

  it('adı olmayan kayda varsayılan ad verir', () => {
    expect(normalizeVaultEntry({ password: 'x1' }).name).toBe('Adsız kayıt')
    expect(normalizeVaultEntry({ name: '   ', password: 'x1' }).name).toBe('Adsız kayıt')
  })

  it('geçersiz tarihi şimdiki zamanla değiştirir', () => {
    const result = normalizeVaultEntry({ ...complete, date: 'dün' })
    expect(result.date).not.toBe('dün')
    expect(Number.isNaN(Date.parse(result.date))).toBe(false)
  })

  it('şifresi olmayan kayıt için null döner', () => {
    expect(normalizeVaultEntry({ name: 'Şifresiz' })).toBeNull()
    expect(normalizeVaultEntry({ name: 'Boş', password: '' })).toBeNull()
    expect(normalizeVaultEntry({ name: 'Nesne', password: { a: 1 } })).toBeNull()
  })

  it('nesne olmayan girdi için null döner', () => {
    expect(normalizeVaultEntry(null)).toBeNull()
    expect(normalizeVaultEntry('metin')).toBeNull()
    expect(normalizeVaultEntry([complete])).toBeNull()
  })

  it('bilinmeyen alanları korur, önizleme bayraklarını kaldırır', () => {
    const result = normalizeVaultEntry({ ...complete, note: 'not', isDuplicate: true, duplicateName: 'Banka' })
    expect(result.note).toBe('not')
    expect(result).not.toHaveProperty('isDuplicate')
    expect(result).not.toHaveProperty('duplicateName')
  })
})

describe('normalizeVaultEntry isteğe bağlı alanlar', () => {
  it('kullanıcı adı, site ve notu korur; kullanıcı adı ve siteyi kırpar', () => {
    const result = normalizeVaultEntry({ ...complete, username: '  ali@ornek.com ', url: ' ornek.com ', notes: '  kurtarma kodu: 1234\nikinci satır ' })
    expect(result.username).toBe('ali@ornek.com')
    expect(result.url).toBe('ornek.com')
    expect(result.notes).toBe('  kurtarma kodu: 1234\nikinci satır ')
  })

  it('boş isteğe bağlı alanları kaldırır', () => {
    const result = normalizeVaultEntry({ ...complete, username: '   ', url: '', notes: '\n ' })
    expect(result).not.toHaveProperty('username')
    expect(result).not.toHaveProperty('url')
    expect(result).not.toHaveProperty('notes')
  })

  it('isteğe bağlı alanlar yoksa eklemez', () => {
    const result = normalizeVaultEntry(complete)
    expect(result).not.toHaveProperty('username')
    expect(result).not.toHaveProperty('notes')
  })

  it('uzun notu kısaltmaz', () => {
    const longNote = 'n'.repeat(10000)
    expect(normalizeVaultEntry({ ...complete, notes: longNote }).notes).toHaveLength(10000)
  })

  it('sayı olan kullanıcı adını metne çevirir, nesneyi kaldırır', () => {
    const result = normalizeVaultEntry({ ...complete, username: 12345, url: { a: 1 } })
    expect(result.username).toBe('12345')
    expect(result).not.toHaveProperty('url')
  })
})
