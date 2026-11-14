// Kasa şifre sağlığı: zayıf, birden fazla kayıtta kullanılan ve uzun süredir değişmeyen şifreler.

// Güç skoru bu değer veya altındaysa zayıf sayılır ("Çok Zayıf", "Zayıf")
export const WEAK_MAX_SCORE = 1
// Şifresi bu kadar günden uzun süredir değişmeyen kayıt eski sayılır
export const OLD_AFTER_DAYS = 365
const DAY_MS = 86400000

// Şifrenin son değiştiği an: passwordChangedAt yoksa kaydın oluşturulma tarihi
function passwordChangedTime(entry) {
  const changed = Date.parse(entry.passwordChangedAt ?? '')
  if (!Number.isNaN(changed)) return changed
  const created = Date.parse(entry.date ?? '')
  return Number.isNaN(created) ? null : created
}

export function analyzeVaultHealth(entries, now = Date.now()) {
  const passwordCounts = new Map()
  for (const entry of entries) {
    passwordCounts.set(entry.password, (passwordCounts.get(entry.password) || 0) + 1)
  }

  const counts = { weak: 0, reused: 0, old: 0 }
  const byId = new Map()
  for (const entry of entries) {
    const weak = (entry.strength?.score ?? 0) <= WEAK_MAX_SCORE
    const reuseCount = passwordCounts.get(entry.password) || 1
    const changedTime = passwordChangedTime(entry)
    const ageDays = changedTime === null ? null : Math.max(0, Math.floor((now - changedTime) / DAY_MS))
    const old = ageDays !== null && ageDays > OLD_AFTER_DAYS
    if (weak) counts.weak++
    if (reuseCount > 1) counts.reused++
    if (old) counts.old++
    byId.set(entry.id, { weak, reuseCount, ageDays, old })
  }
  return { counts, byId }
}

// Sağlık filtresi: null hepsini, 'weak' | 'reused' | 'old' ilgili sorunu taşıyanları geçirir
export function matchesHealthFilter(issue, filter) {
  if (!filter) return true
  if (!issue) return false
  if (filter === 'weak') return issue.weak
  if (filter === 'reused') return issue.reuseCount > 1
  if (filter === 'old') return issue.old
  return true
}

export function formatAge(days) {
  if (days >= 365) return `${Math.floor(days / 365)} yıldır`
  return `${Math.max(1, Math.floor(days / 30))} aydır`
}
