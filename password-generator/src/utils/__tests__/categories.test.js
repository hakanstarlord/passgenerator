import { describe, it, expect } from 'vitest'
import { CATEGORIES, getCategoryLabel, getCategoryIcon, normalizeCategory } from '../categories'

describe('CATEGORIES', () => {
  it('en az 5 kategori tanımlıdır', () => {
    expect(CATEGORIES.length).toBeGreaterThanOrEqual(5)
  })

  it('her kategorinin id, label ve icon alanı var', () => {
    for (const cat of CATEGORIES) {
      expect(cat).toHaveProperty('id')
      expect(cat).toHaveProperty('label')
      expect(cat).toHaveProperty('icon')
      expect(typeof cat.id).toBe('string')
      expect(typeof cat.label).toBe('string')
      expect(typeof cat.icon).toBe('string')
    }
  })

  it('"other" kategorisi mevcuttur', () => {
    expect(CATEGORIES.some(c => c.id === 'other')).toBe(true)
  })
})

describe('getCategoryLabel', () => {
  it('bilinen kategoriler için doğru label döner', () => {
    expect(getCategoryLabel('social')).toBe('Sosyal Medya')
    expect(getCategoryLabel('bank')).toBe('Banka')
    expect(getCategoryLabel('email')).toBe('E-posta')
    expect(getCategoryLabel('other')).toBe('Diğer')
  })

  it('bilinmeyen id için "Diğer" döner', () => {
    expect(getCategoryLabel('unknown')).toBe('Diğer')
    expect(getCategoryLabel('')).toBe('Diğer')
  })
})

describe('getCategoryIcon', () => {
  it('bilinen kategoriler için doğru ikon adı döner', () => {
    expect(getCategoryIcon('social')).toBe('Users')
    expect(getCategoryIcon('bank')).toBe('Landmark')
    expect(getCategoryIcon('other')).toBe('Tag')
  })

  it('bilinmeyen id için "Tag" döner', () => {
    expect(getCategoryIcon('unknown')).toBe('Tag')
  })
})

describe('normalizeCategory', () => {
  it('category alanı olan geçerli entry değişmez', () => {
    const entry = { id: '1', name: 'Test', category: 'bank' }
    expect(normalizeCategory(entry)).toEqual(entry)
  })

  it('category alanı olmayan entry\'ye "other" eklenir', () => {
    const entry = { id: '1', name: 'Test' }
    const result = normalizeCategory(entry)
    expect(result.category).toBe('other')
    expect(result.name).toBe('Test')
  })

  it('geçersiz category değeri "other" ile değiştirilir', () => {
    const entry = { id: '1', name: 'Test', category: 'nonexistent' }
    const result = normalizeCategory(entry)
    expect(result.category).toBe('other')
  })

  it('orijinal obje mutasyona uğramaz', () => {
    const entry = { id: '1', name: 'Test' }
    const result = normalizeCategory(entry)
    expect(entry).not.toHaveProperty('category')
    expect(result).toHaveProperty('category', 'other')
  })
})
