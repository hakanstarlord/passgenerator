import { describe, it, expect } from 'vitest'
import { parseImportFile } from '../exportImport'

function createFile(content) {
  return {
    text: () => Promise.resolve(typeof content === 'string' ? content : JSON.stringify(content)),
  }
}

describe('parseImportFile', () => {
  it('geçerli dosyayı parse eder', async () => {
    const validData = {
      format: 'passgen',
      version: 1,
      exportDate: '2024-01-01T00:00:00.000Z',
      count: 3,
      data: 'encryptedBase64Data',
    }
    const result = await parseImportFile(createFile(validData))
    expect(result.format).toBe('passgen')
    expect(result.version).toBe(1)
    expect(result.count).toBe(3)
  })

  it('geçersiz JSON için hata fırlatır', async () => {
    await expect(parseImportFile(createFile('not json {{{'))).rejects.toThrow('Geçersiz dosya formatı.')
  })

  it('yanlış format için hata fırlatır', async () => {
    const wrongFormat = { format: 'other', version: 1, data: 'test' }
    await expect(parseImportFile(createFile(wrongFormat))).rejects.toThrow('Bu dosya PassGen formatında değil.')
  })

  it('daha yeni sürüm için hata fırlatır', async () => {
    const newerVersion = { format: 'passgen', version: 999, data: 'test' }
    await expect(parseImportFile(createFile(newerVersion))).rejects.toThrow('daha yeni bir PassGen sürümüyle')
  })

  it('aynı sürüm için hata fırlatmaz', async () => {
    const sameVersion = { format: 'passgen', version: 1, count: 0, data: 'test' }
    const result = await parseImportFile(createFile(sameVersion))
    expect(result.version).toBe(1)
  })
})
