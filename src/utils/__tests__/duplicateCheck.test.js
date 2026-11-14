import { describe, it, expect } from 'vitest'
import { findDuplicatePassword, flagDuplicateEntries, entryKey, mergeEntries } from '../duplicateCheck'

const mockVault = [
  { id: '1', name: 'Netflix', password: 'abc123!@#' },
  { id: '2', name: 'Gmail', username: 'ali@gmail.com', url: 'gmail.com', password: 'xyz789$%^' },
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

describe('entryKey', () => {
  it('ad, kullanıcı adı ve site büyük/küçük harf ve kenar boşluğu duyarsızdır', () => {
    expect(entryKey({ name: ' GMAİL ', username: 'Ali@Gmail.com', url: 'Gmail.com', password: 'x' }))
      .toBe(entryKey({ name: 'gmail', username: 'ali@gmail.com', url: 'gmail.com', password: 'x' }))
  })

  it('şifre birebir karşılaştırılır', () => {
    expect(entryKey({ name: 'A', password: 'Abc' })).not.toBe(entryKey({ name: 'A', password: 'abc' }))
  })

  it('eksik alanlar boş kabul edilir', () => {
    expect(entryKey({ name: 'A', password: 'p' })).toBe(entryKey({ name: 'A', username: '', url: '', password: 'p' }))
  })
})

describe('flagDuplicateEntries', () => {
  it('yalnızca kasada birebir aynısı olan kaydı işaretler', () => {
    const entries = [
      { name: 'Netflix', password: 'abc123!@#' },
      { name: 'Yeni Netflix', password: 'abc123!@#' },
      { name: 'Spotify', password: 'newPassword789' },
    ]
    const result = flagDuplicateEntries(entries, mockVault)
    expect(result[0].isDuplicate).toBe(true)
    expect(result[0].duplicateName).toBe('Netflix')
    expect(result[1].isDuplicate).toBe(false)
    expect(result[2].isDuplicate).toBe(false)
    expect(result[2].duplicateName).toBeNull()
  })

  it('boş entry dizisi için boş dizi döner', () => {
    expect(flagDuplicateEntries([], mockVault)).toEqual([])
  })

  it('boş vault ile tüm entry\'ler isDuplicate: false olur', () => {
    const result = flagDuplicateEntries([{ name: 'Test', password: 'abc123!@#' }], [])
    expect(result[0].isDuplicate).toBe(false)
  })
})

describe('mergeEntries', () => {
  it('aynı şifreli ama farklı site/ad kayıtları ekler', () => {
    const incoming = [
      { name: 'youtube.com', url: 'https://youtube.com', password: 'xyz789$%^' },
      { name: 'Gmail', username: 'ali@gmail.com', url: 'gmail.com', password: 'xyz789$%^' },
    ]
    const result = mergeEntries(mockVault, incoming)
    expect(result.map(e => e.name)).toEqual(['Netflix', 'Gmail', 'Twitter', 'youtube.com'])
  })

  it('gelen listedeki tekrarları ayıklar, mevcut kayıtları korur', () => {
    const incoming = [
      { name: 'Yeni', password: 'p1' },
      { name: 'yeni ', password: 'p1' },
      { name: 'Yeni', password: 'p2' },
    ]
    const result = mergeEntries(mockVault, incoming)
    expect(result).toHaveLength(5)
    expect(result.slice(0, 3)).toEqual(mockVault)
  })

  it('aynı listeyi ikinci kez birleştirmek bir şey eklemez', () => {
    const incoming = [{ name: 'A', password: 'p' }, { name: 'B', password: 'q' }]
    const once = mergeEntries(mockVault, incoming)
    expect(mergeEntries(once, incoming)).toEqual(once)
  })
})
