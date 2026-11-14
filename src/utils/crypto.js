const PBKDF2_ITERATIONS = 600000
const SALT_LENGTH = 16
const IV_LENGTH = 12
// String.fromCharCode(...bytes) ~200 KB üstünde yığını taşırır; dönüşüm parça parça yapılır
const BASE64_CHUNK = 0x8000

export function bytesToBase64(bytes) {
  let binary = ''
  for (let i = 0; i < bytes.length; i += BASE64_CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + BASE64_CHUNK))
  }
  return btoa(binary)
}

export function base64ToBytes(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

async function importPasswordMaterial(password, usage) {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, [usage])
}

// Ana şifreden AES-GCM anahtarı türetir (PBKDF2, 600.000 iterasyon). Anahtar dışa aktarılamaz.
export async function deriveVaultKey(password, salt) {
  const keyMaterial = await importPasswordMaterial(password, 'deriveKey')
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function hashPassword(password, salt) {
  const keyMaterial = await importPasswordMaterial(password, 'deriveBits')
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    256
  )
  return bytesToBase64(new Uint8Array(bits))
}

// Şifreli blob biçimi: base64(salt[16] | iv[12] | ciphertext)
export function readSalt(encryptedData) {
  return base64ToBytes(encryptedData).slice(0, SALT_LENGTH)
}

// Önceden türetilmiş anahtarla şifreler; salt blob'a yazılır, IV her çağrıda yeni ve rastgeledir
export async function encryptWithKey(plaintext, key, salt) {
  if (salt?.length !== SALT_LENGTH) throw new Error('Geçersiz salt uzunluğu.')
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext))
  )
  const combined = new Uint8Array(SALT_LENGTH + IV_LENGTH + ciphertext.length)
  combined.set(salt, 0)
  combined.set(iv, SALT_LENGTH)
  combined.set(ciphertext, SALT_LENGTH + IV_LENGTH)
  return bytesToBase64(combined)
}

export async function decryptWithKey(encryptedData, key) {
  const combined = base64ToBytes(encryptedData)
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH)
  const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH)
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
  return new TextDecoder().decode(decrypted)
}

export async function encrypt(plaintext, password) {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  return encryptWithKey(plaintext, await deriveVaultKey(password, salt), salt)
}

export async function decrypt(encryptedData, password) {
  return decryptWithKey(encryptedData, await deriveVaultKey(password, readSalt(encryptedData)))
}
