// Kasayı kilitleyen sistem olayları: Windows/macOS ekran kilidi ve uyku.
// `electron` import etmez: powerMonitor parametre olarak verilir, böylece test edilebilir.
// Pencereyi küçültmek kilitlemez (kullanıcı tercihi).

export const LOCK_EVENTS = ['lock-screen', 'suspend']

export function registerLockTriggers({ powerMonitor, onLock }) {
  const handlers = LOCK_EVENTS.map((event) => {
    const handler = () => onLock(event)
    powerMonitor.on(event, handler)
    return [event, handler]
  })
  return () => {
    for (const [event, handler] of handlers) powerMonitor.removeListener(event, handler)
  }
}
