import { calculateStrength } from './passwordGenerator'
import { normalizeCategory } from './categories'

const CHAR_TYPE_KEYS = ['uppercase', 'lowercase', 'numbers', 'symbols']
// İçe aktarma önizlemesinde eklenen geçici alanlar kasaya yazılmaz
const IMPORT_PREVIEW_FLAGS = ['isDuplicate', 'duplicateName']
// Kayıt formundaki isteğe bağlı alanlar: kullanıcı adı, site, not
export const OPTIONAL_TEXT_FIELDS = ['username', 'url', 'notes']

function detectCharTypes(password) {
  return {
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    numbers: /[0-9]/.test(password),
    symbols: /[^a-zA-Z0-9]/.test(password),
  }
}

function isValidCharTypes(charTypes) {
  return !!charTypes && typeof charTypes === 'object'
    && CHAR_TYPE_KEYS.every((key) => typeof charTypes[key] === 'boolean')
}

function isValidDate(value) {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

function toText(value) {
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return ''
}

// Kasaya giren her kaydı (içe aktarma, kilit açma, migrasyon) arayüzün beklediği şekle getirir.
// Eksik alanlar şifreden türetilir, bilinmeyen alanlar korunur.
// Şifresi olmayan kayıt için null döner; böyle bir kayıtta saklanacak şifre yoktur.
export function normalizeVaultEntry(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const password = toText(raw.password)
  if (!password) return null

  const entry = { ...raw }
  IMPORT_PREVIEW_FLAGS.forEach((flag) => delete entry[flag])
  const name = toText(raw.name).trim()

  // İsteğe bağlı metin alanları: boşsa alan hiç tutulmaz; içerik kısaltılmaz (veri kaybı olmasın)
  for (const field of OPTIONAL_TEXT_FIELDS) {
    if (!(field in entry)) continue
    const text = field === 'notes' ? toText(entry[field]) : toText(entry[field]).trim()
    if (text.trim()) entry[field] = text
    else delete entry[field]
  }

  return normalizeCategory({
    ...entry,
    id: typeof raw.id === 'string' && raw.id ? raw.id : crypto.randomUUID(),
    name: name || 'Adsız kayıt',
    password,
    length: password.length,
    strength: calculateStrength(password),
    charTypes: isValidCharTypes(raw.charTypes) ? raw.charTypes : detectCharTypes(password),
    date: isValidDate(raw.date) ? raw.date : new Date().toISOString(),
  })
}
