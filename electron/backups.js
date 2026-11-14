// Kasa yedekleri için yardımcılar. `electron` import etmez, testlerde doğrudan kullanılır.
// Kural: yedekler asla silinmez ve üzerine yazılmaz (bkz. CLAUDE.md, tasks/lessons.md).

import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'

export const BACKUP_DIR_NAME = 'yedekler'
export const MAX_BACKUP_LENGTH = 10 * 1024 * 1024

const pad = (value, length = 2) => String(value).padStart(length, '0')

// Yerel saatle sıfır dolgulu ad; alfabetik sıra zaman sırasıyla aynıdır.
export function backupFileName(date, suffix = 0) {
  const day = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  const time = `${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}-${pad(date.getMilliseconds(), 3)}`
  return `passgen-${day}_${time}${suffix > 0 ? `-${suffix}` : ''}.passgen`
}

// Renderer'dan gelen yükün şifreli bir .passgen dosyası olduğunu doğrular.
export function isValidBackupPayload(json) {
  if (typeof json !== 'string' || json.length > MAX_BACKUP_LENGTH) return false
  try {
    const parsed = JSON.parse(json)
    return parsed?.format === 'passgen' && typeof parsed.data === 'string' && parsed.data.length > 0
  } catch {
    return false
  }
}

// Yedeği `dir` içinde yeni bir dosyaya yazar ve dosya adını döndürür (geçersiz yükte null).
// `wx` bayrağı var olan dosyanın üzerine yazmayı engeller; aynı ad varsa ek denenir.
export async function writeBackupFile(dir, json, now = new Date()) {
  if (!isValidBackupPayload(json)) return null
  await mkdir(dir, { recursive: true })
  for (let suffix = 0; suffix < 100; suffix++) {
    const name = backupFileName(now, suffix)
    try {
      await writeFile(join(dir, name), json, { encoding: 'utf-8', flag: 'wx' })
      return name
    } catch (err) {
      if (err.code !== 'EEXIST') throw err
    }
  }
  return null
}
