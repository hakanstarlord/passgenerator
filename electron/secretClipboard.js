// Şifre kopyalama ve otomatik pano temizliği (ana süreçte çalışır).
// `electron` import etmez: pano ve zamanlayıcı parametre olarak verilir, böylece test edilebilir.
// Renderer'daki navigator.clipboard pencere odakta değilken çalışmadığı için temizlik burada yapılır.
// Electron 44+ pano API'si async: readText/writeText Promise döndürür, bu yüzden hepsi await edilir.

export const CLIPBOARD_CLEAR_MS = 30000
export const MAX_SECRET_LENGTH = 100000

export function createSecretClipboard({
  clipboard,
  delayMs = CLIPBOARD_CLEAR_MS,
  setTimer = setTimeout,
  clearTimer = clearTimeout,
}) {
  // Bekleyen temizlik: { text, timer }
  let pending = null

  function hasPending() {
    return pending !== null
  }

  // Panoda hâlâ bizim kopyaladığımız metin varsa temizler; kullanıcı başka bir şey kopyaladıysa dokunmaz
  async function clearNow() {
    const entry = pending
    if (!entry) return
    pending = null
    clearTimer(entry.timer)
    if ((await clipboard.readText()) === entry.text) await clipboard.clear()
  }

  async function copy(text) {
    if (typeof text !== 'string' || text.length > MAX_SECRET_LENGTH) return false
    if (pending) clearTimer(pending.timer)
    pending = null
    await clipboard.writeText(text)
    const entry = { text, timer: null }
    entry.timer = setTimer(() => {
      // Sonradan yapılan bir kopyalama bu zamanlayıcıyı geçersiz kılmışsa hiçbir şey yapma
      if (pending === entry) clearNow().catch(() => {})
    }, delayMs)
    pending = entry
    return true
  }

  return { copy, clearNow, hasPending }
}
