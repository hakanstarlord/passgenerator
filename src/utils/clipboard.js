const CLEAR_AFTER_MS = 30000
let clearTimer = null

// Şifreyi panoya kopyalar; 30 sn sonra hâlâ panodaysa silinir.
// Electron'da kopyalama ve temizlik ana süreçte yapılır (pencere odakta olmasa da çalışır,
// uygulama kapanırken de temizlenir). Web modunda tarayıcı pano API'si kullanılır.
export async function copyToClipboard(text) {
  const copySecret = typeof window === 'undefined' ? undefined : window.electronAPI?.copySecret
  if (copySecret) {
    const copied = await copySecret(text)
    if (!copied) throw new Error('Panoya kopyalanamadı.')
    return
  }

  await navigator.clipboard.writeText(text)

  if (clearTimer) clearTimeout(clearTimer)

  clearTimer = setTimeout(async () => {
    try {
      const current = await navigator.clipboard.readText()
      if (current === text) {
        await navigator.clipboard.writeText('')
      }
    } catch {
      // Tarayıcıda pano erişimi (ör. pencere odakta değilken) reddedilebilir
    }
    clearTimer = null
  }, CLEAR_AFTER_MS)
}
