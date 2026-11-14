import { describe, it, expect } from 'vitest'
import { reencryptVault } from '../vaultPassword'
import { encrypt, decrypt, encryptWithKey, decryptWithKey, hashPassword, base64ToBytes } from '../crypto'

const OLD = 'Eski ana şifre 2026!'
const NEW = 'Yeni ana şifre 2027?'
const entries = JSON.stringify([
  { id: '1', name: 'Banka', password: 'Xk9#mP2$vL7!', username: 'hakan', notes: 'kurtarma: 1234' },
  { id: '2', name: 'E-posta', password: 'Qw3^Zr8&Tn5@' },
])

describe('reencryptVault', () => {
  it('kasayı yeni şifreyle açılır, eski şifreyle açılmaz hale getirir; içerik aynen kalır', async () => {
    const storedData = await encrypt(entries, OLD)
    const { vault } = await reencryptVault(storedData, OLD, NEW)
    expect(await decrypt(vault.data, NEW)).toBe(entries)
    await expect(decrypt(vault.data, OLD)).rejects.toThrow()
    expect(vault.version).toBe(2)
  })

  it('passwordHash yeni şifreyle eşleşir (eski sürümlerle uyumluluk)', async () => {
    const { vault } = await reencryptVault(await encrypt(entries, OLD), OLD, NEW)
    expect(await hashPassword(NEW, base64ToBytes(vault.hashSalt))).toBe(vault.passwordHash)
    expect(await hashPassword(OLD, base64ToBytes(vault.hashSalt))).not.toBe(vault.passwordHash)
  })

  it('yanlış mevcut şifrede wrong-current fırlatır', async () => {
    const storedData = await encrypt(entries, OLD)
    await expect(reencryptVault(storedData, 'yanlış şifre', NEW)).rejects.toThrow('wrong-current')
  })

  it('bozuk veride wrong-current fırlatır', async () => {
    await expect(reencryptVault('bozuk-veri', OLD, NEW)).rejects.toThrow('wrong-current')
  })

  it('dönen anahtar ve salt ile yapılan sonraki yazmalar yeni şifreyle açılır', async () => {
    const { key, salt, vault } = await reencryptVault(await encrypt(entries, OLD), OLD, NEW)
    expect(await decryptWithKey(vault.data, key)).toBe(entries)
    const next = await encryptWithKey('sonraki yazma', key, salt)
    expect(await decrypt(next, NEW)).toBe('sonraki yazma')
  })
})
