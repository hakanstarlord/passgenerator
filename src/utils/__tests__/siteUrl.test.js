import { describe, it, expect } from 'vitest'
import { toSiteUrl } from '../siteUrl'

describe('toSiteUrl', () => {
  it('şema yoksa https:// ekler', () => {
    expect(toSiteUrl('ornek.com')).toBe('https://ornek.com/')
    expect(toSiteUrl('  giris.banka.com.tr/hesap  ')).toBe('https://giris.banka.com.tr/hesap')
  })

  it('http ve https adreslerini korur', () => {
    expect(toSiteUrl('https://mail.ornek.com/giris?x=1')).toBe('https://mail.ornek.com/giris?x=1')
    expect(toSiteUrl('http://modem.local.ag')).toBe('http://modem.local.ag/')
  })

  it('Türkçe karakterli alan adını kabul eder', () => {
    expect(toSiteUrl('şifre.com')).toMatch(/^https:\/\/xn--/)
  })

  it('http/https dışındaki şemaları reddeder', () => {
    expect(toSiteUrl('javascript:alert(1)')).toBeNull()
    expect(toSiteUrl('file:///C:/Windows/System32/calc.exe')).toBeNull()
    expect(toSiteUrl('ftp://ornek.com')).toBeNull()
    expect(toSiteUrl('mailto:ali@ornek.com')).toBeNull()
  })

  it('geçersiz veya boş girdiyi reddeder', () => {
    expect(toSiteUrl('')).toBeNull()
    expect(toSiteUrl('   ')).toBeNull()
    expect(toSiteUrl(undefined)).toBeNull()
    expect(toSiteUrl('sadece metin')).toBeNull()
    expect(toSiteUrl('noktasiz')).toBeNull()
  })

  it('localhost adresine izin verir', () => {
    expect(toSiteUrl('http://localhost:8080')).toBe('http://localhost:8080/')
  })
})
