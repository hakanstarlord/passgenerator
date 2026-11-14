// Kasa kaydındaki "Site" alanını açılabilir bir adrese çevirir.
// Yalnızca http/https kabul edilir; şema yazılmamışsa https:// eklenir. Geçersizse null.
export function toSiteUrl(input) {
  const text = typeof input === 'string' ? input.trim() : ''
  if (!text || /\s/.test(text)) return null
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`
  try {
    const url = new URL(withScheme)
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    if (!url.hostname || (!url.hostname.includes('.') && url.hostname !== 'localhost')) return null
    return url.href
  } catch {
    return null
  }
}

// Siteyi varsayılan tarayıcıda açar. Electron'da ana süreç (site:open IPC) açar, web modunda yeni sekme.
export async function openSite(input) {
  const url = toSiteUrl(input)
  if (!url) return false
  const openInMain = typeof window === 'undefined' ? undefined : window.electronAPI?.openSite
  if (openInMain) return openInMain(url)
  window.open(url, '_blank', 'noopener,noreferrer')
  return true
}
