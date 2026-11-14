// Şifre kopyalama ve otomatik pano temizliği (ana süreçte çalışır).
// `electron` import etmez: pano ve zamanlayıcı parametre olarak verilir, böylece test edilebilir.
// Renderer'daki navigator.clipboard pencere odakta değilken çalışmadığı için temizlik burada yapılır.

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

  // Panoda hâlâ bizim kopyaladığımız metin varsa temizler; kullanıcı başka bir şey kopyaladıysa dokunmaz
  function clearNow() {
    if (!pending) return
    clearTimer(pending.timer)
    if (clipboard.readText() === pending.text) clipboard.clear()
    pending = null
  }

  function copy(text) {
    if (typeof text !== 'string' || text.length > MAX_SECRET_LENGTH) return false
    if (pending) clearTimer(pending.timer)
    clipboard.writeText(text)
    const entry = { text, timer: null }
    entry.timer = setTimer(() => {
      // Sonradan yapılan bir kopyalama bu zamanlayıcıyı geçersiz kılmışsa hiçbir şey yapma
      if (pending === entry) clearNow()
    }, delayMs)
    pending = entry
    return true
  }

  return { copy, clearNow }
}
