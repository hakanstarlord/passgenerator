import { useState, useCallback, useRef } from 'react'
import { encrypt, decrypt, hashPassword } from '../utils/crypto'
import { calculateStrength } from '../utils/passwordGenerator'
import { normalizeVaultEntry } from '../utils/vaultEntry'
import { saveAutoBackup } from '../utils/exportImport'

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
  const masterPasswordRef = useRef(null)
  // Kasaya en son yazılmış liste; her değişiklik bunun üzerinden hesaplanır
  const passwordsRef = useRef([])
  // Kasa yazmaları sırayla çalışır, böylece art arda gelen değişiklikler birbirini ezmez
  const writeQueueRef = useRef(Promise.resolve())

  const stored = readRawStorage()
  const hasLegacy = isLegacyData(stored)
  const isInitialized = !!(stored && !hasLegacy && stored.version === 2)
  const needsMigration = hasLegacy && stored.length > 0

  const persistEncrypted = useCallback(async (passwords, password) => {
    const stored = readRawStorage()
    const plaintext = JSON.stringify(passwords)
    const data = await encrypt(plaintext, password)
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
      const password = masterPasswordRef.current
      if (!password) return false
      let next
      try {
        next = updater(passwordsRef.current)
        await persistEncrypted(next, password)
      } catch {
        return false
      }
      // Yazma sürerken kasa kilitlendiyse çözülmüş listeyi belleğe geri yükleme
      if (masterPasswordRef.current === password) {
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
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const saltB64 = btoa(String.fromCharCode(...salt))
    const pwHash = await hashPassword(password, salt)

    let initialPasswords = []

    // Eski düz metin verisi varsa migrasyon yap
    if (needsMigration) {
      localStorage.setItem(BACKUP_KEY, JSON.stringify(stored))
      initialPasswords = toVaultEntries(stored)
    }

    const plaintext = JSON.stringify(initialPasswords)
    const data = await encrypt(plaintext, password)

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 2,
      passwordHash: pwHash,
      hashSalt: saltB64,
      data
    }))
    saveAutoBackup(data, initialPasswords.length)

    // Migrasyon başarılı — yedek temizle
    if (needsMigration) {
      localStorage.removeItem(BACKUP_KEY)
    }

    masterPasswordRef.current = password
    passwordsRef.current = initialPasswords
    setSavedPasswords(initialPasswords)
    setIsLocked(false)
  }, [needsMigration, stored])

  const unlock = useCallback(async (password) => {
    const stored = readRawStorage()
    if (!stored || stored.version !== 2) return false

    const salt = Uint8Array.from(atob(stored.hashSalt), (c) => c.charCodeAt(0))
    const pwHash = await hashPassword(password, salt)

    if (pwHash !== stored.passwordHash) return false

    try {
      const plaintext = await decrypt(stored.data, password)
      // Daha önce eksik alanlarla kaydedilmiş kayıtlar da burada onarılır
      const passwords = toVaultEntries(JSON.parse(plaintext))
      masterPasswordRef.current = password
      passwordsRef.current = passwords
      setSavedPasswords(passwords)
      setIsLocked(false)
      return true
    } catch {
      return false
    }
  }, [])

  const lock = useCallback(() => {
    masterPasswordRef.current = null
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
      const updated = { ...item, ...updates }
      if (updates.password && updates.password !== item.password) {
        updated.strength = calculateStrength(updates.password)
        updated.length = updates.password.length
      }
      return updated
    }))
  }, [mutate])

  const importPasswords = useCallback((entries, mode) => {
    return mutate((prev) => {
      const incoming = toVaultEntries(entries).map(e => ({ ...e, id: crypto.randomUUID() }))
      if (mode === 'replace') return incoming
      const existingPasswords = new Set(prev.map(p => p.password))
      return [...prev, ...incoming.filter(e => !existingPasswords.has(e.password))]
    })
  }, [mutate])

  const restorePassword = useCallback((entry) => {
    return mutate((prev) => (
      prev.some((item) => item.id === entry.id) ? prev : [entry, ...prev]
    ))
  }, [mutate])

  const getMasterPassword = useCallback(() => {
    return masterPasswordRef.current
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
    getMasterPassword
  }
}
