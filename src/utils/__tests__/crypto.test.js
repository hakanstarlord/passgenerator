import { describe, it, expect } from 'vitest'
import { encrypt, decrypt, hashPassword } from '../crypto'

describe('encrypt / decrypt round-trip', () => {
  it('şifrelenmiş veriyi doğru şifreyle çözer', async () => {
    const plaintext = 'Merhaba Dünya! 123 @#$'
    const password = 'testŞifre123!'
    const encrypted = await encrypt(plaintext, password)
    const decrypted = await decrypt(encrypted, password)
    expect(decrypted).toBe(plaintext)
  })

  it('büyük veri ile çalışır', async () => {
    const plaintext = JSON.stringify(Array.from({ length: 100 }, (_, i) => ({
      id: i,
      name: `Entry ${i}`,
      password: 'x'.repeat(32),
    })))
    const password = 'güçlüŞifre!@#'
    const encrypted = await encrypt(plaintext, password)
    const decrypted = await decrypt(encrypted, password)
    expect(decrypted).toBe(plaintext)
  })

  it('yanlış şifreyle decrypt hata fırlatır', async () => {
    const encrypted = await encrypt('gizli veri', 'doğruŞifre')
    await expect(decrypt(encrypted, 'yanlışŞifre')).rejects.toThrow()
  })

  it('her seferinde farklı şifreli metin üretir (farklı salt/iv)', async () => {
    const plaintext = 'test verisi'
    const password = 'aynıŞifre'
    const enc1 = await encrypt(plaintext, password)
    const enc2 = await encrypt(plaintext, password)
    expect(enc1).not.toBe(enc2)
  })
})

describe('hashPassword', () => {
  it('aynı input ve salt ile aynı hash üretir', async () => {
    const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
    const hash1 = await hashPassword('testPassword', salt)
    const hash2 = await hashPassword('testPassword', salt)
    expect(hash1).toBe(hash2)
  })

  it('farklı salt ile farklı hash üretir', async () => {
    const salt1 = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
    const salt2 = new Uint8Array([16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1])
    const hash1 = await hashPassword('testPassword', salt1)
    const hash2 = await hashPassword('testPassword', salt2)
    expect(hash1).not.toBe(hash2)
  })

  it('farklı şifreler ile farklı hash üretir', async () => {
    const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
    const hash1 = await hashPassword('password1', salt)
    const hash2 = await hashPassword('password2', salt)
    expect(hash1).not.toBe(hash2)
  })

  it('base64 string döner', async () => {
    const salt = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16])
    const hash = await hashPassword('test', salt)
    expect(typeof hash).toBe('string')
    expect(hash.length).toBeGreaterThan(0)
    // base64 karakter kontrolü
    expect(hash).toMatch(/^[A-Za-z0-9+/=]+$/)
  })
})
