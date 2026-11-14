// Geçmişin diskte saklanması. Düz metin asla yazılmaz:
// değer Electron safeStorage (Windows DPAPI) ile şifrelenir; şifreleme yoksa geçmiş yalnızca bellekte kalır.
// Fonksiyonlar storage ve şifreleme köprüsünü parametre alır, böylece node'da test edilebilir.

export const HISTORY_KEY = 'passgen_history'
export const UNREADABLE_KEY = 'passgen_history_unreadable'
export const MAX_HISTORY_SIZE = 100
export const MAX_AGE_DAYS = 30

// 30 günden eski veya tarihi geçersiz kayıtları atar, en yeni 100 kaydı tutar
export function pruneHistory(entries, now = Date.now()) {
  const cutoff = now - MAX_AGE_DAYS * 86400000
  return entries
    .filter((item) => new Date(item?.date).getTime() > cutoff)
    .slice(0, MAX_HISTORY_SIZE)
}

function parseStored(raw) {
  if (!raw) return { kind: 'empty' }
  try {
    const value = JSON.parse(raw)
    if (Array.isArray(value)) return { kind: 'legacy', entries: value }
    if (value?.version === 2 && typeof value.protected === 'string') {
      return { kind: 'protected', encoded: value.protected }
    }
  } catch {
    // aşağıda okunamayan veri olarak ele alınır
  }
  return { kind: 'invalid' }
}

// Okunamayan veriyi silmeden kenara alır; sonraki yazma üzerine yazsa da kopya kalır
function setAside(storage, raw, now) {
  const key = storage.getItem(UNREADABLE_KEY) === null ? UNREADABLE_KEY : `${UNREADABLE_KEY}_${now}`
  storage.setItem(key, raw)
}

export async function saveHistory(entries, { storage, protect }) {
  if (!protect) return false
  const encoded = await protect(JSON.stringify(entries))
  if (typeof encoded !== 'string' || !encoded) return false
  storage.setItem(HISTORY_KEY, JSON.stringify({ version: 2, protected: encoded }))
  return true
}

export async function loadHistory({ storage, protect, unprotect, canProtect, now = Date.now() }) {
  const raw = storage.getItem(HISTORY_KEY)
  const stored = parseStored(raw)

  if (stored.kind === 'empty') return []

  if (stored.kind === 'legacy') {
    const entries = pruneHistory(stored.entries, now)
    // Eski düz metin geçmişi hemen şifreli biçime çevir
    if (canProtect) await saveHistory(entries, { storage, protect })
    return entries
  }

  if (stored.kind === 'protected') {
    // Web modunda çözülemez ama Electron'da okunabilir; dokunma
    if (!unprotect) return []
    const text = await unprotect(stored.encoded)
    if (typeof text === 'string') {
      try {
        const entries = JSON.parse(text)
        if (Array.isArray(entries)) return pruneHistory(entries, now)
      } catch {
        // aşağıda kenara alınır
      }
    }
  }

  setAside(storage, raw, now)
  return []
}

export function getSecureBridge() {
  const api = typeof window === 'undefined' ? undefined : window.electronAPI
  if (!api?.protectText || !api?.unprotectText) {
    return { canProtect: false, protect: null, unprotect: null }
  }
  return { canProtect: true, protect: api.protectText, unprotect: api.unprotectText }
}
