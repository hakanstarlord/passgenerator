import { encrypt, decrypt } from './crypto'

const EXPORT_VERSION = 1

// Şifreli kasa verisinden İçe Aktar'ın okuyabildiği .passgen dosya içeriğini üretir.
// Kasadaki `data` alanı ile dışa aktarmadaki `data` aynı formattadır.
export function buildExportFile(encryptedData, count) {
  return JSON.stringify({
    format: 'passgen',
    version: EXPORT_VERSION,
    exportDate: new Date().toISOString(),
    count,
    data: encryptedData,
  }, null, 2)
}

export async function exportVault(passwords, masterPassword) {
  const plaintext = JSON.stringify(passwords)
  const encryptedData = await encrypt(plaintext, masterPassword)

  const blob = new Blob([buildExportFile(encryptedData, passwords.length)], { type: 'application/json' })
  const filename = `passgen-yedek-${new Date().toISOString().slice(0, 10)}.passgen`
  downloadFile(blob, filename)
}

// Electron'da kasanın şifreli halini otomatik yedek olarak yazdırır (yedekler hiç silinmez).
// Web modunda yapılacak bir şey yoktur; yedek hatası kasa yazmasını etkilemez.
export function saveAutoBackup(encryptedData, count) {
  const backupVault = typeof window === 'undefined' ? undefined : window.electronAPI?.backupVault
  if (!backupVault) return
  Promise.resolve()
    .then(() => backupVault(buildExportFile(encryptedData, count)))
    .then((ok) => {
      if (!ok) console.warn('Kasa yedeği yazılamadı.')
    })
    .catch((err) => console.warn('Kasa yedeği yazılamadı:', err))
}

function downloadFile(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function parseImportFile(file) {
  const text = await file.text()
  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Geçersiz dosya formatı.')
  }

  if (parsed.format !== 'passgen') {
    throw new Error('Bu dosya PassGen formatında değil.')
  }

  if (parsed.version > EXPORT_VERSION) {
    throw new Error('Bu dosya daha yeni bir PassGen sürümüyle oluşturulmuş. Lütfen uygulamayı güncelleyin.')
  }

  return parsed
}

export async function decryptImportData(fileData, password) {
  let entries
  try {
    const plaintext = await decrypt(fileData.data, password)
    entries = JSON.parse(plaintext)
  } catch {
    throw new Error('Şifre yanlış veya dosya bozuk.')
  }
  if (!Array.isArray(entries)) {
    throw new Error('Dosyada kayıt listesi bulunamadı.')
  }
  return entries
}
