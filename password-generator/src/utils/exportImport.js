import { encrypt, decrypt } from './crypto'

const EXPORT_VERSION = 1

export async function exportVault(passwords, masterPassword) {
  const plaintext = JSON.stringify(passwords)
  const encryptedData = await encrypt(plaintext, masterPassword)

  const exportData = {
    format: 'passgen',
    version: EXPORT_VERSION,
    exportDate: new Date().toISOString(),
    count: passwords.length,
    data: encryptedData,
  }

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const filename = `passgen-yedek-${new Date().toISOString().slice(0, 10)}.passgen`
  downloadFile(blob, filename)
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
  try {
    const plaintext = await decrypt(fileData.data, password)
    return JSON.parse(plaintext)
  } catch {
    throw new Error('Şifre yanlış veya dosya bozuk.')
  }
}
