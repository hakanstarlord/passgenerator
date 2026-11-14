import { describe, it, expect } from 'vitest'
import {
  HISTORY_KEY,
  UNREADABLE_KEY,
  MAX_HISTORY_SIZE,
  pruneHistory,
  loadHistory,
  saveHistory,
} from '../historyStorage'

const NOW = new Date('2026-11-14T12:00:00.000Z').getTime()
const DAY = 86400000

function createStorage(initial = {}) {
  const data = { ...initial }
  return {
    data,
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => { data[key] = String(value) },
    removeItem: (key) => { delete data[key] },
  }
}

// Sahte safeStorage: ters çevirip önek ekler (düz metin çıktıda görünmez)
const protect = async (text) => 'P:' + [...text].reverse().join('')
const unprotect = async (encoded) => (encoded.startsWith('P:') ? [...encoded.slice(2)].reverse().join('') : null)
const bridge = { protect, unprotect, canProtect: true }

const entry = (id, daysAgo, password = `Gizli-Şifre-${id}!`) => ({
  id,
  password,
  date: new Date(NOW - daysAgo * DAY).toISOString(),
})

describe('pruneHistory', () => {
  it('30 günden eski ve tarihi geçersiz kayıtları atar', () => {
    const result = pruneHistory([entry('a', 1), entry('b', 31), { id: 'c', date: 'dün' }, null], NOW)
    expect(result.map((e) => e.id)).toEqual(['a'])
  })

  it('en fazla 100 kayıt tutar, en yenileri korur', () => {
    const many = Array.from({ length: 120 }, (_, i) => entry(String(i), 0))
    const result = pruneHistory(many, NOW)
    expect(result).toHaveLength(MAX_HISTORY_SIZE)
    expect(result[0].id).toBe('0')
  })
})

describe('saveHistory', () => {
  it('şifreli biçimde yazar, düz metin bırakmaz', async () => {
    const storage = createStorage()
    expect(await saveHistory([entry('a', 0)], { storage, protect })).toBe(true)
    const stored = JSON.parse(storage.data[HISTORY_KEY])
    expect(stored.version).toBe(2)
    expect(typeof stored.protected).toBe('string')
    expect(storage.data[HISTORY_KEY]).not.toContain('Gizli-Şifre-a!')
  })

  it('şifreleme yoksa veya başarısızsa hiçbir şey yazmaz', async () => {
    const storage = createStorage()
    expect(await saveHistory([entry('a', 0)], { storage, protect: null })).toBe(false)
    expect(await saveHistory([entry('a', 0)], { storage, protect: async () => null })).toBe(false)
    expect(storage.data).toEqual({})
  })
})

describe('loadHistory', () => {
  it('boş depoda boş liste döner ve yazmaz', async () => {
    const storage = createStorage()
    expect(await loadHistory({ storage, ...bridge, now: NOW })).toEqual([])
    expect(storage.data).toEqual({})
  })

  it('eski düz metin geçmişi okur ve şifreli biçime taşır', async () => {
    const legacy = [entry('a', 1), entry('b', 2), entry('eski', 40)]
    const storage = createStorage({ [HISTORY_KEY]: JSON.stringify(legacy) })
    const result = await loadHistory({ storage, ...bridge, now: NOW })
    expect(result.map((e) => e.id)).toEqual(['a', 'b'])
    expect(JSON.parse(storage.data[HISTORY_KEY]).version).toBe(2)
    expect(storage.data[HISTORY_KEY]).not.toContain('Gizli-Şifre-a!')
  })

  it('şifreleme yoksa eski değeri okur ama değiştirmez', async () => {
    const raw = JSON.stringify([entry('a', 1)])
    const storage = createStorage({ [HISTORY_KEY]: raw })
    const result = await loadHistory({ storage, canProtect: false, protect: null, unprotect: null, now: NOW })
    expect(result.map((e) => e.id)).toEqual(['a'])
    expect(storage.data[HISTORY_KEY]).toBe(raw)
  })

  it('şifreli geçmişi çözüp okur', async () => {
    const storage = createStorage()
    await saveHistory([entry('a', 1), entry('b', 3)], { storage, protect })
    const result = await loadHistory({ storage, ...bridge, now: NOW })
    expect(result.map((e) => e.id)).toEqual(['a', 'b'])
    expect(result[0].password).toBe('Gizli-Şifre-a!')
  })

  it('web modunda şifreli değere dokunmaz', async () => {
    const storage = createStorage()
    await saveHistory([entry('a', 1)], { storage, protect })
    const before = storage.data[HISTORY_KEY]
    const result = await loadHistory({ storage, canProtect: false, protect: null, unprotect: null, now: NOW })
    expect(result).toEqual([])
    expect(storage.data[HISTORY_KEY]).toBe(before)
    expect(storage.data[UNREADABLE_KEY]).toBeUndefined()
  })

  it('çözülemeyen değeri silmeden kenara alır', async () => {
    const raw = JSON.stringify({ version: 2, protected: 'başka-hesap' })
    const storage = createStorage({ [HISTORY_KEY]: raw })
    expect(await loadHistory({ storage, ...bridge, now: NOW })).toEqual([])
    expect(storage.data[UNREADABLE_KEY]).toBe(raw)
    expect(storage.data[HISTORY_KEY]).toBe(raw)
  })

  it('bozuk değeri kenara alır, önceki kenara alınmışı korur', async () => {
    const storage = createStorage({ [HISTORY_KEY]: 'bozuk {{{', [UNREADABLE_KEY]: 'önceki' })
    expect(await loadHistory({ storage, ...bridge, now: NOW })).toEqual([])
    expect(storage.data[UNREADABLE_KEY]).toBe('önceki')
    expect(storage.data[`${UNREADABLE_KEY}_${NOW}`]).toBe('bozuk {{{')
  })
})
