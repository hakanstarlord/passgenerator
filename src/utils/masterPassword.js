import { calculateStrength } from './passwordGenerator'

export const MIN_MASTER_PASSWORD_LENGTH = 12
export const MIN_MASTER_PASSWORD_SCORE = 2

// Ana şifre kuralı: en az 12 karakter ve en az "Orta" güç.
// Sorun yoksa null, varsa kullanıcıya gösterilecek Türkçe mesajı döndürür.
export function getMasterPasswordProblem(password) {
  if (!password || password.length < MIN_MASTER_PASSWORD_LENGTH) {
    return `En az ${MIN_MASTER_PASSWORD_LENGTH} karakter olmalıdır (şu an ${password?.length ?? 0}).`
  }
  if (calculateStrength(password).score < MIN_MASTER_PASSWORD_SCORE) {
    return 'En az "Orta" güçte olmalıdır. Harf, rakam ve sembolü karıştırın ya da daha uzun bir cümle kullanın.'
  }
  return null
}
