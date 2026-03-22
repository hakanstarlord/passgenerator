import { describe, it, expect } from 'vitest'
import { findDuplicatePassword, flagDuplicateEntries } from '../duplicateCheck'

const mockVault = [
  { id: '1', name: 'Netflix', password: 'abc123!@#' },
  { id: '2', name: 'Gmail', password: 'xyz789$%^' },
  { id: '3', name: 'Twitter', password: 'qwerty456' },
]

describe('findDuplicatePassword', () => {
  it('eşleşen şifre varsa entry adını döner', () => {
    expect(findDuplicatePassword('abc123!@#', mockVault)).toBe('Netflix')
  })

  it('eşleşme yoksa null döner', () => {
    expect(findDuplicatePassword('uniquePassword123', mockVault)).toBeNull()
  })

  it('boş şifre için null döner', () => {
    expect(findDuplicatePassword('', mockVault)).toBeNull()
    expect(findDuplicatePassword(null, mockVault)).toBeNull()
  })

  it('boş vault için null döner', () => {
    expect(findDuplicatePassword('abc123!@#', [])).toBeNull()
    expect(findDuplicatePassword('abc123!@#', null)).toBeNull()
  })
})

describe('flagDuplicateEntries', () => {
  it('eşleşen entry\'leri isDuplicate: true olarak işaretler', () => {
    const entries = [
      { name: 'New Netflix', password: 'abc123!@#' },
      { name: 'Spotify', password: 'newPassword789' },
    ]
    const result = flagDuplicateEntries(entries, mockVault)
    expect(result[0].isDuplicate).toBe(true)
    expect(result[0].duplicateName).toBe('Netflix')
    expect(result[1].isDuplicate).toBe(false)
    expect(result[1].duplicateName).toBeNull()
  })

  it('boş entry dizisi için boş dizi döner', () => {
    expect(flagDuplicateEntries([], mockVault)).toEqual([])
  })

  it('boş vault ile tüm entry\'ler isDuplicate: false olur', () => {
    const entries = [{ name: 'Test', password: 'abc123!@#' }]
    const result = flagDuplicateEntries(entries, [])
    expect(result[0].isDuplicate).toBe(false)
  })

  it('birden fazla duplicate doğru işaretlenir', () => {
    const entries = [
      { name: 'A', password: 'abc123!@#' },
      { name: 'B', password: 'xyz789$%^' },
      { name: 'C', password: 'uniqueOne' },
    ]
    const result = flagDuplicateEntries(entries, mockVault)
    expect(result.filter(e => e.isDuplicate)).toHaveLength(2)
    expect(result[2].isDuplicate).toBe(false)
  })
})
