import { deriveVaultKey, readSalt, decryptWithKey, encryptWithKey, hashPassword, bytesToBase64 } from './crypto'

const SALT_LENGTH = 16

// Kasa verisini mevcut ana şifreyle açıp yeni ana şifreyle (yeni salt) yeniden şifreler.
// Düz metin aynen korunur. Mevcut şifre yanlışsa Error('wrong-current') fırlatır.
// Dönen { key, salt } bellekte tutulur; sonraki yazmalar bununla yapılır.
export async function reencryptVault(storedData, currentPassword, newPassword) {
  let plaintext
  try {
    const currentKey = await deriveVaultKey(currentPassword, readSalt(storedData))
    plaintext = await decryptWithKey(storedData, currentKey)
  } catch {
    throw new Error('wrong-current')
  }

  // passwordHash yalnızca eski sürümlerle uyumluluk için yazılır (kilit açma GCM'e dayanır)
  const hashSalt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const passwordHash = await hashPassword(newPassword, hashSalt)
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const key = await deriveVaultKey(newPassword, salt)
  const data = await encryptWithKey(plaintext, key, salt)

  return {
    vault: { version: 2, passwordHash, hashSalt: bytesToBase64(hashSalt), data },
    key,
    salt,
  }
}
