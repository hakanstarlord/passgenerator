import { useState, useCallback, useRef } from 'react'
import { deriveVaultKey, encryptWithKey, decryptWithKey, readSalt, hashPassword, bytesToBase64 } from '../utils/crypto'
import { normalizeVaultEntry } from '../utils/vaultEntry'
import { mergeEntries } from '../utils/duplicateCheck'
import { saveAutoBackup, downloadExportFile } from '../utils/exportImport'
import { reencryptVault } from '../utils/vaultPassword'
import { getMasterPasswordProblem } from '../utils/masterPassword'

const STORAGE_KEY = 'passgen_vault'
const BACKUP_KEY = 'passgen_vault_backup'

function readRawStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function isLegacyData(stored) {
  return Array.isArray(stored)
}

// Dışarıdan gelen kayıtları kasa biçimine getirir; şifresi olmayanlar atlanır
function toVaultEntries(list) {
  return list.map(normalizeVaultEntry).filter(Boolean)
}

export default function useSavedPasswords() {
  const [savedPasswords, setSavedPasswords] = useState([])
  const [isLocked, setIsLocked] = useState(true)
  // Ana şifre bellekte tutulmaz: kilit açılışında bir kez türetilen, dışa aktarılamaz
  // AES-GCM anahtarı ve kasa salt'ı tutulur ({ key, salt }); kilitliyken null
  const vaultKeyRef = useRef(null)
  // Kasaya en son yazılmış liste; her değişiklik bunun üzerinden hesaplanır
  const passwordsRef = useRef([])
  // Kasa yazmaları sırayla çalışır, böylece art arda gelen değişiklikler birbirini ezmez
  const writeQueueRef = useRef(Promise.resolve())
  // Yedekler yazmadan sonraki hali alır. Her kilit açma oturumunun ilk yazmasından önce
  // mevcut hal de bir kez yedeklenir; böylece hiç yedeği olmayan bir hal kaybolmaz.
  const sessionBackupDoneRef = useRef(false)

  const stored = readRawStorage()
  const hasLegacy = isLegacyData(stored)
  const isInitialized = !!(stored && !hasLegacy && stored.version === 2)
  const needsMigration = hasLegacy && stored.length > 0

  const persistEncrypted = useCallback(async (passwords, vaultKey) => {
    const stored = readRawStorage()
    const plaintext = JSON.stringify(passwords)
    const data = await encryptWithKey(plaintext, vaultKey.key, vaultKey.salt)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 2,
      passwordHash: stored?.passwordHash,
      hashSalt: stored?.hashSalt,
      data
    }))
    // Kasa yazıldıktan sonra her sürüm ayrı bir dosyaya yedeklenir (beklenmez)
    saveAutoBackup(data, passwords.length)
  }, [])

  // Değişikliği sıraya ekler. `updater` bir önceki yazma bittikten sonra, kasadaki
  // güncel liste ile çağrılır. Bellekteki liste yalnızca yazma başarılı olursa güncellenir.
  const mutate = useCallback((updater) => {
    const run = async () => {
      const vaultKey = vaultKeyRef.current
      if (!vaultKey) return false
      let next
      try {
        next = updater(passwordsRef.current)
        if (!sessionBackupDoneRef.current) {
          const current = readRawStorage()
          if (current?.data) saveAutoBackup(current.data, passwordsRef.current.length)
          sessionBackupDoneRef.current = true
        }
        await persistEncrypted(next, vaultKey)
      } catch {
        return false
      }
      // Yazma sürerken kasa kilitlendiyse çözülmüş listeyi belleğe geri yükleme
      if (vaultKeyRef.current === vaultKey) {
        passwordsRef.current = next
        setSavedPasswords(next)
      }
      return true
    }
    const result = writeQueueRef.current.then(run)
    writeQueueRef.current = result
    return result
  }, [persistEncrypted])

  const setupMasterPassword = useCallback(async (password) => {
    // passwordHash yalnızca eski sürümlerle uyumluluk için yazılır; kilit açma GCM doğrulamasına dayanır
    const hashSalt = crypto.getRandomValues(new Uint8Array(16))
    const pwHash = await hashPassword(password, hashSalt)
    const vaultSalt = crypto.getRandomValues(new Uint8Array(16))
    const key = await deriveVaultKey(password, vaultSalt)

    let initialPasswords = []

    // Eski düz metin verisi varsa migrasyon yap
    if (needsMigration) {
      localStorage.setItem(BACKUP_KEY, JSON.stringify(stored))
      initialPasswords = toVaultEntries(stored)
    }

    const plaintext = JSON.stringify(initialPasswords)
    const data = await encryptWithKey(plaintext, key, vaultSalt)

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 2,
      passwordHash: pwHash,
      hashSalt: bytesToBase64(hashSalt),
      data
    }))
    saveAutoBackup(data, initialPasswords.length)

    // Migrasyon başarılı — yedek temizle
    if (needsMigration) {
      localStorage.removeItem(BACKUP_KEY)
    }

    vaultKeyRef.current = { key, salt: vaultSalt }
    // Kurulumdaki ilk hal zaten yedeklendi
    sessionBackupDoneRef.current = true
    passwordsRef.current = initialPasswords
    setSavedPasswords(initialPasswords)
    setIsLocked(false)
  }, [needsMigration, stored])

  const unlock = useCallback(async (password) => {
    const stored = readRawStorage()
    if (!stored || stored.version !== 2) return false

    try {
      // Anahtar tek seferde türetilir. AES-GCM yanlış anahtarla çözmeyi reddeder,
      // bu yüzden ayrıca şifre özeti kontrolüne (ikinci 600.000 iterasyon) gerek yok.
      const salt = readSalt(stored.data)
      const key = await deriveVaultKey(password, salt)
      const plaintext = await decryptWithKey(stored.data, key)
      // Daha önce eksik alanlarla kaydedilmiş kayıtlar da burada onarılır
      const passwords = toVaultEntries(JSON.parse(plaintext))
      vaultKeyRef.current = { key, salt }
      sessionBackupDoneRef.current = false
      passwordsRef.current = passwords
      setSavedPasswords(passwords)
      setIsLocked(false)
      return true
    } catch {
      return false
    }
  }, [])

  const lock = useCallback(() => {
    vaultKeyRef.current = null
    sessionBackupDoneRef.current = false
    passwordsRef.current = []
    setSavedPasswords([])
    setIsLocked(true)
  }, [])

  const savePasswords = useCallback((entries) => {
    return mutate((prev) => [...entries, ...prev])
  }, [mutate])

  const removePassword = useCallback((id) => {
    return mutate((prev) => prev.filter((item) => item.id !== id))
  }, [mutate])

  const clearAll = useCallback(() => {
    return mutate(() => [])
  }, [mutate])

  const updatePassword = useCallback((id, updates) => {
    return mutate((prev) => prev.map(item => {
      if (item.id !== id) return item
      const merged = { ...item, ...updates }
      // Şifre değiştiyse karakter türleri yeniden hesaplanır ve değişim tarihi kaydedilir (sağlık: şifre yaşı)
      if (updates.password !== undefined && updates.password !== item.password) {
        delete merged.charTypes
        merged.passwordChangedAt = new Date().toISOString()
      }
      // Güç ve uzunluk şifreden türetilir; boşaltılan isteğe bağlı alanlar kaldırılır
      return normalizeVaultEntry(merged) ?? item
    }))
  }, [mutate])

  const importPasswords = useCallback((entries, mode) => {
    return mutate((prev) => {
      const incoming = toVaultEntries(entries).map(e => ({ ...e, id: crypto.randomUUID() }))
      if (mode === 'replace') return incoming
      // Birebir aynı kayıtlar atlanır; aynı şifreli farklı site/ad kayıtları eklenir
      return mergeEntries(prev, incoming)
    })
  }, [mutate])

  const restorePassword = useCallback((entry) => {
    return mutate((prev) => (
      prev.some((item) => item.id === entry.id) ? prev : [entry, ...prev]
    ))
  }, [mutate])

  // Ana şifreyi değiştirir. Yazma kuyruğunda çalışır, bekleyen kayıtlarla çakışmaz.
  // Sonuç: 'ok' | 'wrong-current' | 'same' | 'invalid-new' | 'locked' | 'failed'
  const changeMasterPassword = useCallback((currentPassword, newPassword) => {
    const run = async () => {
      const vaultKey = vaultKeyRef.current
      if (!vaultKey) return 'locked'
      if (getMasterPasswordProblem(newPassword)) return 'invalid-new'
      if (currentPassword === newPassword) return 'same'

      const stored = readRawStorage()
      if (!stored?.data) return 'failed'
      let result
      try {
        result = await reencryptVault(stored.data, currentPassword, newPassword)
      } catch (err) {
        return err.message === 'wrong-current' ? 'wrong-current' : 'failed'
      }

      try {
        const count = passwordsRef.current.length
        // Yedekler silinmez: değişiklikten önceki hal eski şifreyle bir kez daha yedeklenir
        saveAutoBackup(stored.data, count)
        sessionBackupDoneRef.current = true
        localStorage.setItem(STORAGE_KEY, JSON.stringify(result.vault))
        saveAutoBackup(result.vault.data, count)
      } catch {
        return 'failed'
      }
      // Değişiklik sürerken kasa kilitlendiyse anahtarı belleğe geri koyma
      if (vaultKeyRef.current === vaultKey) {
        vaultKeyRef.current = { key: result.key, salt: result.salt }
      }
      return 'ok'
    }
    const result = writeQueueRef.current.then(run)
    writeQueueRef.current = result
    return result
  }, [])

  // Güncel kasayı bellekteki anahtarla şifreleyip .passgen olarak indirir.
  // Dosya ana şifreyle açılır (salt blob'un içinde); ana şifrenin bellekte olması gerekmez.
  const exportPasswords = useCallback(async () => {
    const vaultKey = vaultKeyRef.current
    if (!vaultKey) return false
    const list = passwordsRef.current
    const data = await encryptWithKey(JSON.stringify(list), vaultKey.key, vaultKey.salt)
    downloadExportFile(data, list.length)
    return true
  }, [])

  return {
    savedPasswords,
    isLocked,
    isInitialized,
    needsMigration,
    unlock,
    lock,
    setupMasterPassword,
    savePasswords,
    removePassword,
    clearAll,
    updatePassword,
    importPasswords,
    restorePassword,
    exportPasswords,
    changeMasterPassword
  }
}
