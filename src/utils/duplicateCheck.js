// Formdaki "bu şifre kasada zaten var" uyarısı için: aynı şifreyi kullanan kaydın adı
export function findDuplicatePassword(password, vaultPasswords) {
  if (!password || !vaultPasswords?.length) return null
  const match = vaultPasswords.find(entry => entry.password === password)
  return match ? match.name : null
}

const keyPart = (value) => (typeof value === 'string' ? value.trim().toLocaleLowerCase('tr') : '')

// Aynı kayıt: ad, kullanıcı adı ve site aynı (büyük/küçük harf duyarsız), şifre birebir aynı.
// Yalnızca şifreye bakılmaz: aynı şifre farklı sitelerde kullanılabilir ve bu kayıtlar atlanmamalı.
export function entryKey(entry) {
  return [keyPart(entry.name), keyPart(entry.username), keyPart(entry.url), entry.password ?? ''].join('\u0000')
}

// İçe aktarma önizlemesi: kasada birebir aynısı olan kayıtları işaretler
export function flagDuplicateEntries(entries, vaultPasswords) {
  if (!entries?.length) return []
  const existing = new Map((vaultPasswords || []).map(entry => [entryKey(entry), entry.name]))
  return entries.map(entry => {
    const duplicateName = existing.get(entryKey(entry)) ?? null
    return { ...entry, isDuplicate: duplicateName !== null, duplicateName }
  })
}

// Birleştirme: mevcut kayıtlar korunur; kasada birebir aynısı olanlar ve gelen listedeki tekrarlar atlanır
export function mergeEntries(existing, incoming) {
  const seen = new Set(existing.map(entryKey))
  const added = []
  for (const entry of incoming) {
    const key = entryKey(entry)
    if (seen.has(key)) continue
    seen.add(key)
    added.push(entry)
  }
  return [...existing, ...added]
}
