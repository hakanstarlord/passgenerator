import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, readdir, readFile, rm } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { backupFileName, isValidBackupPayload, writeBackupFile, MAX_BACKUP_LENGTH } from '../backups.js'

const payload = (data) => JSON.stringify({ format: 'passgen', version: 1, exportDate: '2026-11-14T00:00:00.000Z', count: 1, data })

describe('writeBackupFile', () => {
  let dir

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'passgen-yedek-test-'))
  })

  afterEach(async () => {
    // Yalnızca testin kendi geçici klasörü temizlenir
    await rm(dir, { recursive: true, force: true })
  })

  it('yedeği yeni bir dosyaya yazar', async () => {
    const name = await writeBackupFile(join(dir, 'yedekler'), payload('ilk'), new Date(2026, 10, 14, 20, 0, 0, 0))
    expect(name).toBe('passgen-2026-11-14_20-00-00-000.passgen')
    expect(await readFile(join(dir, 'yedekler', name), 'utf-8')).toBe(payload('ilk'))
  })

  it('aynı zamanda iki yedekte ilkinin üzerine yazmaz, ekli ad kullanır', async () => {
    const now = new Date(2026, 10, 14, 20, 0, 0, 0)
    const first = await writeBackupFile(dir, payload('ilk'), now)
    const second = await writeBackupFile(dir, payload('ikinci'), now)
    expect(second).toBe('passgen-2026-11-14_20-00-00-000-1.passgen')
    expect(await readFile(join(dir, first), 'utf-8')).toBe(payload('ilk'))
    expect(await readFile(join(dir, second), 'utf-8')).toBe(payload('ikinci'))
  })

  it('çok sayıda yedekte hiçbir dosyayı silmez', async () => {
    for (let i = 0; i < 50; i++) {
      await writeBackupFile(dir, payload(`surum-${i}`), new Date(2026, 0, 1 + i, 12, 0, 0, 0))
    }
    expect((await readdir(dir)).length).toBe(50)
  })

  it('geçersiz yükü yazmaz', async () => {
    expect(await writeBackupFile(dir, 'not json')).toBeNull()
    expect(await readdir(dir)).toEqual([])
  })
})

describe('backupFileName', () => {
  it('yerel saatle sıfır dolgulu ad üretir', () => {
    const date = new Date(2026, 0, 5, 7, 8, 9, 42)
    expect(backupFileName(date)).toBe('passgen-2026-01-05_07-08-09-042.passgen')
  })

  it('ek verilirse adın sonuna ekler', () => {
    const date = new Date(2026, 0, 5, 7, 8, 9, 42)
    expect(backupFileName(date, 2)).toBe('passgen-2026-01-05_07-08-09-042-2.passgen')
  })

  it('farklı zamanlar için farklı ad üretir', () => {
    const a = backupFileName(new Date(2026, 10, 14, 20, 40, 1, 1))
    const b = backupFileName(new Date(2026, 10, 14, 20, 40, 1, 2))
    expect(a).not.toBe(b)
  })

  it('alfabetik sıra zaman sırasıyla aynıdır', () => {
    const dates = [
      new Date(2026, 10, 14, 9, 0, 0, 0),
      new Date(2025, 11, 31, 23, 59, 59, 999),
      new Date(2026, 10, 14, 10, 0, 0, 0),
      new Date(2026, 1, 1, 0, 0, 0, 5),
    ]
    const byName = dates.map((d) => backupFileName(d)).sort()
    const byTime = [...dates].sort((a, b) => a - b).map((d) => backupFileName(d))
    expect(byName).toEqual(byTime)
  })
})

describe('isValidBackupPayload', () => {
  const valid = { format: 'passgen', version: 1, exportDate: '2026-11-14T00:00:00.000Z', count: 1, data: 'c2lmcmVsaQ==' }

  it('geçerli .passgen yükünü kabul eder', () => {
    expect(isValidBackupPayload(JSON.stringify(valid))).toBe(true)
  })

  it('string olmayan yükü reddeder', () => {
    expect(isValidBackupPayload(valid)).toBe(false)
    expect(isValidBackupPayload(undefined)).toBe(false)
  })

  it('JSON olmayan yükü reddeder', () => {
    expect(isValidBackupPayload('not json {{{')).toBe(false)
  })

  it('yanlış formatı reddeder', () => {
    expect(isValidBackupPayload(JSON.stringify({ ...valid, format: 'other' }))).toBe(false)
  })

  it('data alanı olmayan veya boş yükü reddeder', () => {
    expect(isValidBackupPayload(JSON.stringify({ ...valid, data: undefined }))).toBe(false)
    expect(isValidBackupPayload(JSON.stringify({ ...valid, data: '' }))).toBe(false)
  })

  it('çok büyük yükü reddeder', () => {
    const big = JSON.stringify({ ...valid, data: 'a'.repeat(MAX_BACKUP_LENGTH) })
    expect(isValidBackupPayload(big)).toBe(false)
  })
})
