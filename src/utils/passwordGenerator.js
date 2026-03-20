const CHAR_SETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
}

function getRandomIndex(max) {
  const array = new Uint32Array(1)
  const limit = Math.floor(0x100000000 / max) * max
  let value
  do {
    crypto.getRandomValues(array)
    value = array[0]
  } while (value >= limit)
  return value % max
}

function shuffle(arr) {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = getRandomIndex(i + 1)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function generatePassword(length, { uppercase, lowercase, numbers, symbols }) {
  const activeSets = []
  if (uppercase) activeSets.push(CHAR_SETS.uppercase)
  if (lowercase) activeSets.push(CHAR_SETS.lowercase)
  if (numbers) activeSets.push(CHAR_SETS.numbers)
  if (symbols) activeSets.push(CHAR_SETS.symbols)

  if (activeSets.length === 0) return ''

  // Her seçili setten en az 1 karakter garantile
  const guaranteed = activeSets.map(
    (set) => set[getRandomIndex(set.length)]
  )

  // Kalan karakterleri birleşik havuzdan rastgele doldur
  const pool = activeSets.join('')
  const remaining = Array.from({ length: length - guaranteed.length }, () =>
    pool[getRandomIndex(pool.length)]
  )

  // Birleştir ve karıştır
  return shuffle([...guaranteed, ...remaining]).join('')
}

export function calculateStrength(password) {
  if (!password) return { score: 0, label: 'Çok Zayıf', color: '#ef4444' }

  let score = 0

  // Uzunluk
  if (password.length >= 8) score++
  if (password.length >= 16) score++
  if (password.length >= 24) score++

  // Karakter çeşitliliği
  const hasLower = /[a-z]/.test(password)
  const hasUpper = /[A-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSymbol = /[^a-zA-Z0-9]/.test(password)
  const variety = [hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length
  if (variety >= 3) score++
  if (variety >= 4) score++

  // Tekrar eden karakterler ceza
  const chars = password.split('')
  const uniqueRatio = new Set(chars).size / chars.length
  if (uniqueRatio < 0.5) score = Math.max(0, score - 2)
  else if (uniqueRatio < 0.7) score = Math.max(0, score - 1)

  // Score'u 0-4 arasına sınırla
  score = Math.min(4, Math.max(0, score))

  const levels = [
    { label: 'Çok Zayıf', color: '#ef4444' },   // kırmızı
    { label: 'Zayıf', color: '#f97316' },         // turuncu
    { label: 'Orta', color: '#eab308' },           // sarı
    { label: 'Güçlü', color: '#22c55e' },          // yeşil
    { label: 'Çok Güçlü', color: '#4ade80' },      // parlak yeşil
  ]

  return { score, ...levels[score] }
}
