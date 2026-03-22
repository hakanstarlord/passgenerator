let clearTimer = null

export async function copyToClipboard(text) {
  await navigator.clipboard.writeText(text)

  if (clearTimer) clearTimeout(clearTimer)

  clearTimer = setTimeout(async () => {
    try {
      const current = await navigator.clipboard.readText()
      if (current === text) {
        await navigator.clipboard.writeText('')
      }
    } catch {
      // Pano erişimi reddedilmiş olabilir — sessizce geç
    }
    clearTimer = null
  }, 30000)
}
