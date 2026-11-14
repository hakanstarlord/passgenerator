import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createSecretClipboard, CLIPBOARD_CLEAR_MS, MAX_SECRET_LENGTH } from '../secretClipboard.js'

function createFakeClipboard(initial = 'önceki içerik') {
  let text = initial
  return {
    writeText: vi.fn((value) => { text = value }),
    readText: () => text,
    clear: vi.fn(() => { text = '' }),
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

  it('kopyalar ve 30 saniye sonra temizler, daha önce temizlemez', () => {
    expect(secret.copy('Gizli-Şifre-1!')).toBe(true)
    expect(clipboard.readText()).toBe('Gizli-Şifre-1!')
    vi.advanceTimersByTime(29999)
    expect(clipboard.readText()).toBe('Gizli-Şifre-1!')
    vi.advanceTimersByTime(1)
    expect(clipboard.readText()).toBe('')
    expect(clipboard.clear).toHaveBeenCalledTimes(1)
  })

  it('arada kullanıcı başka bir şey kopyaladıysa panoya dokunmaz', () => {
    secret.copy('Gizli-Şifre-1!')
    clipboard.writeText('kullanıcının metni')
    vi.advanceTimersByTime(CLIPBOARD_CLEAR_MS)
    expect(clipboard.readText()).toBe('kullanıcının metni')
    expect(clipboard.clear).not.toHaveBeenCalled()
  })

  it('ikinci kopyalama süreyi sıfırlar; ilk zamanlayıcı ikinci şifreyi erken silmez', () => {
    secret.copy('Birinci!')
    vi.advanceTimersByTime(20000)
    secret.copy('İkinci!')
    vi.advanceTimersByTime(10000)
    expect(clipboard.readText()).toBe('İkinci!')
    vi.advanceTimersByTime(20000)
    expect(clipboard.readText()).toBe('')
    expect(clipboard.clear).toHaveBeenCalledTimes(1)
  })

  it('clearNow bekleyen şifreyi hemen temizler ve zamanlayıcıyı iptal eder', () => {
    secret.copy('Gizli!')
    secret.clearNow()
    expect(clipboard.readText()).toBe('')
    vi.advanceTimersByTime(CLIPBOARD_CLEAR_MS)
    expect(clipboard.clear).toHaveBeenCalledTimes(1)
  })

  it('clearNow, pano artık bizim değilse dokunmaz; bekleyen yoksa bir şey yapmaz', () => {
    secret.clearNow()
    expect(clipboard.clear).not.toHaveBeenCalled()
    secret.copy('Gizli!')
    clipboard.writeText('başka metin')
    secret.clearNow()
    expect(clipboard.readText()).toBe('başka metin')
    expect(clipboard.clear).not.toHaveBeenCalled()
  })

  it('geçersiz girdiyi reddeder ve panoya yazmaz', () => {
    expect(secret.copy(undefined)).toBe(false)
    expect(secret.copy(12345)).toBe(false)
    expect(secret.copy('a'.repeat(MAX_SECRET_LENGTH + 1))).toBe(false)
    expect(clipboard.writeText).not.toHaveBeenCalled()
    expect(clipboard.readText()).toBe('önceki içerik')
  })
})
