import { useState, useCallback, useRef } from 'react'
import { encrypt, decrypt, hashPassword } from '../utils/crypto'

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

export default function useSavedPasswords() {
  const [savedPasswords, setSavedPasswords] = useState([])
  const [isLocked, setIsLocked] = useState(true)
  const masterPasswordRef = useRef(null)

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
  }, [])

  const setupMasterPassword = useCallback(async (password) => {
    const salt = crypto.getRandomValues(new Uint8Array(16))
    const saltB64 = btoa(String.fromCharCode(...salt))
    const pwHash = await hashPassword(password, salt)

    let initialPasswords = []

    // Eski düz metin verisi varsa migrasyon yap
    if (needsMigration) {
      localStorage.setItem(BACKUP_KEY, JSON.stringify(stored))
      initialPasswords = stored
    }

    const plaintext = JSON.stringify(initialPasswords)
    const data = await encrypt(plaintext, password)

    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 2,
      passwordHash: pwHash,
      hashSalt: saltB64,
      data
    }))

    // Migrasyon başarılı — yedek temizle
    if (needsMigration) {
      localStorage.removeItem(BACKUP_KEY)
    }

    masterPasswordRef.current = password
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
      const passwords = JSON.parse(plaintext)
      masterPasswordRef.current = password
      setSavedPasswords(passwords)
      setIsLocked(false)
      return true
    } catch {
      return false
    }
  }, [])

  const lock = useCallback(() => {
    masterPasswordRef.current = null
    setSavedPasswords([])
    setIsLocked(true)
  }, [])

  const savePassword = useCallback(async (entry) => {
    if (isLocked || !masterPasswordRef.current) return false
    const next = [entry, ...savedPasswords]
    await persistEncrypted(next, masterPasswordRef.current)
    setSavedPasswords(next)
    return true
  }, [isLocked, savedPasswords, persistEncrypted])

  const removePassword = useCallback(async (id) => {
    if (isLocked || !masterPasswordRef.current) return
    const next = savedPasswords.filter((item) => item.id !== id)
    await persistEncrypted(next, masterPasswordRef.current)
    setSavedPasswords(next)
  }, [isLocked, savedPasswords, persistEncrypted])

  const clearAll = useCallback(async () => {
    if (isLocked || !masterPasswordRef.current) return
    await persistEncrypted([], masterPasswordRef.current)
    setSavedPasswords([])
  }, [isLocked, persistEncrypted])

  return {
    savedPasswords,
    isLocked,
    isInitialized,
    needsMigration,
    unlock,
    lock,
    setupMasterPassword,
    savePassword,
    removePassword,
    clearAll
  }
}
