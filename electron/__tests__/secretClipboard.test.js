import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createSecretClipboard, CLIPBOARD_CLEAR_MS, MAX_SECRET_LENGTH } from '../secretClipboard.js'

// Electron 44+ pano API'si gibi: okuma ve yazma Promise döndürür
function createFakeClipboard(initial = 'önceki içerik') {
  let text = initial
  return {
    writeText: vi.fn(async (value) => { text = value }),
    readText: vi.fn(async () => text),
    clear: vi.fn(async () => { text = '' }),
    current: () => text,
  }
}

describe('createSecretClipboard', () => {
  let clipboard
  let secret

  beforeEach(() => {
    vi.useFakeTimers()
    clipboard = createFakeClipboard()
    secret = createSecretClipboard({ clipboard })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('varsayılan temizleme süresi 30 saniyedir', () => {
    expect(CLIPBOARD_CLEAR_MS).toBe(30000)
  })

  it('kopyalar ve 30 saniye sonra temizler, daha önce temizlemez', async () => {
    expect(await secret.copy('Gizli-Şifre-1!')).toBe(true)
    expect(clipboard.current()).toBe('Gizli-Şifre-1!')
    expect(secret.hasPending()).toBe(true)
    await vi.advanceTimersByTimeAsync(29999)
    expect(clipboard.current()).toBe('Gizli-Şifre-1!')
    await vi.advanceTimersByTimeAsync(1)
    expect(clipboard.current()).toBe('')
    expect(clipboard.clear).toHaveBeenCalledTimes(1)
    expect(secret.hasPending()).toBe(false)
  })

  it('arada kullanıcı başka bir şey kopyaladıysa panoya dokunmaz', async () => {
    await secret.copy('Gizli-Şifre-1!')
    await clipboard.writeText('kullanıcının metni')
    await vi.advanceTimersByTimeAsync(CLIPBOARD_CLEAR_MS)
    expect(clipboard.current()).toBe('kullanıcının metni')
    expect(clipboard.clear).not.toHaveBeenCalled()
  })

  it('ikinci kopyalama süreyi sıfırlar; ilk zamanlayıcı ikinci şifreyi erken silmez', async () => {
    await secret.copy('Birinci!')
    await vi.advanceTimersByTimeAsync(20000)
    await secret.copy('İkinci!')
    await vi.advanceTimersByTimeAsync(10000)
    expect(clipboard.current()).toBe('İkinci!')
    await vi.advanceTimersByTimeAsync(20000)
    expect(clipboard.current()).toBe('')
    expect(clipboard.clear).toHaveBeenCalledTimes(1)
  })

  it('clearNow bekleyen şifreyi hemen temizler ve zamanlayıcıyı iptal eder', async () => {
    await secret.copy('Gizli!')
    await secret.clearNow()
    expect(clipboard.current()).toBe('')
    expect(secret.hasPending()).toBe(false)
    await vi.advanceTimersByTimeAsync(CLIPBOARD_CLEAR_MS)
    expect(clipboard.clear).toHaveBeenCalledTimes(1)
  })

  it('clearNow, pano artık bizim değilse dokunmaz; bekleyen yoksa bir şey yapmaz', async () => {
    await secret.clearNow()
    expect(clipboard.readText).not.toHaveBeenCalled()
    await secret.copy('Gizli!')
    await clipboard.writeText('başka metin')
    await secret.clearNow()
    expect(clipboard.current()).toBe('başka metin')
    expect(clipboard.clear).not.toHaveBeenCalled()
  })

  it('geçersiz girdiyi reddeder ve panoya yazmaz', async () => {
    expect(await secret.copy(undefined)).toBe(false)
    expect(await secret.copy(12345)).toBe(false)
    expect(await secret.copy('a'.repeat(MAX_SECRET_LENGTH + 1))).toBe(false)
    expect(clipboard.writeText).not.toHaveBeenCalled()
    expect(clipboard.current()).toBe('önceki içerik')
  })

  it('pano okuması Promise döndürse de karşılaştırma doğru çalışır (Electron 44+ regresyonu)', async () => {
    await secret.copy('Promise-Şifre!')
    await vi.advanceTimersByTimeAsync(CLIPBOARD_CLEAR_MS)
    expect(clipboard.readText).toHaveBeenCalled()
    expect(clipboard.current()).toBe('')
  })
})
