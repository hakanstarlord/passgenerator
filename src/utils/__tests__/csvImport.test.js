import { describe, it, expect } from 'vitest'
import { parseCsv, csvToEntries } from '../csvImport'

describe('parseCsv', () => {
  it('basit satırları ayırır', () => {
    expect(parseCsv('a,b,c\n1,2,3')).toEqual([['a', 'b', 'c'], ['1', '2', '3']])
  })

  it('tırnaklı alanda virgül, satır sonu ve kaçışlı tırnağı korur', () => {
    const csv = 'name,note\n"Banka, ana hesap","ilk satır\nikinci ""tırnaklı"" satır"'
    expect(parseCsv(csv)).toEqual([
      ['name', 'note'],
      ['Banka, ana hesap', 'ilk satır\nikinci "tırnaklı" satır'],
    ])
  })

  it('BOM ve CRLF satır sonlarını işler, boş satırları atar', () => {
    const csv = '﻿name,password\r\nA,1\r\n\r\nB,2\r\n'
    expect(parseCsv(csv)).toEqual([['name', 'password'], ['A', '1'], ['B', '2']])
  })

  it('boş alanları korur', () => {
    expect(parseCsv('a,b,c\n,x,')).toEqual([['a', 'b', 'c'], ['', 'x', '']])
  })

  it('tırnakla başlamayan alandaki tırnağı olduğu gibi bırakır', () => {
    expect(parseCsv('a\nab"c')).toEqual([['a'], ['ab"c']])
  })
})

describe('csvToEntries', () => {
  it('Chrome biçimini (note sütunlu) okur', () => {
    const csv = 'name,url,username,password,note\ngoogle.com,https://accounts.google.com/,ali@gmail.com,Gizli-1!,"kurtarma: 1234"'
    expect(csvToEntries(csv)).toEqual([{
      name: 'google.com', url: 'https://accounts.google.com/', username: 'ali@gmail.com',
      password: 'Gizli-1!', notes: 'kurtarma: 1234', category: 'other',
    }])
  })

  it('Edge biçimini (note sütunsuz) okur', () => {
    const [entry] = csvToEntries('name,url,username,password\nOutlook,https://outlook.live.com,ali,Sifre-2?')
    expect(entry).toMatchObject({ name: 'Outlook', username: 'ali', password: 'Sifre-2?', notes: '' })
  })

  it('Firefox biçimini okur ve adı siteden türetir', () => {
    const csv = '"url","username","password","httpRealm","formActionOrigin","guid","timeCreated","timeLastUsed","timePasswordChanged"\n' +
      '"https://www.ornek.com.tr","veli","Sifre-3#","","https://www.ornek.com.tr","{abc}","1","2","3"'
    expect(csvToEntries(csv)[0]).toMatchObject({ name: 'ornek.com.tr', url: 'https://www.ornek.com.tr', username: 'veli', password: 'Sifre-3#' })
  })

  it('site geçersizse adı kullanıcı adından alır', () => {
    const [entry] = csvToEntries('name,url,username,password\n,android://abc@com.ornek.app/,uygulama.kullanici,Sifre-4$')
    expect(entry.name).toBe('uygulama.kullanici')
    expect(entry.url).toBe('android://abc@com.ornek.app/')
  })

  it('başlıklar büyük/küçük harf duyarsızdır', () => {
    expect(csvToEntries('Name,URL,Username,Password\nA,a.com,u,p')[0]).toMatchObject({ name: 'A', url: 'a.com', username: 'u', password: 'p' })
  })

  it('şifresi boş satırları da döndürür (önizleme sayar, normalleştirme atlar)', () => {
    const entries = csvToEntries('name,url,username,password\nA,a.com,u,\nB,b.com,v,p2')
    expect(entries).toHaveLength(2)
    expect(entries[0].password).toBe('')
  })

  it('şifrenin baş ve sonundaki boşlukları korur', () => {
    expect(csvToEntries('name,password\nA, boşluklu ')[0].password).toBe(' boşluklu ')
  })

  it('şifre sütunu yoksa Türkçe hata fırlatır', () => {
    expect(() => csvToEntries('ad,soyad\nAli,Veli')).toThrow('şifre sütunu bulunamadı')
  })

  it('boş dosyada hata fırlatır', () => {
    expect(() => csvToEntries('')).toThrow('CSV dosyası boş.')
    expect(() => csvToEntries('﻿\r\n')).toThrow('CSV dosyası boş.')
  })
})

describe('csvToEntries timePasswordChanged', () => {
  it('Firefox şifre değişim zamanını passwordChangedAt olarak alır', () => {
    const csv = '"url","username","password","timePasswordChanged"\n"https://ornek.com","ali","Sifre-1!","1700000000000"'
    expect(csvToEntries(csv)[0].passwordChangedAt).toBe(new Date(1700000000000).toISOString())
  })

  it('sütun yoksa veya değer sayı değilse alanı eklemez', () => {
    expect(csvToEntries('name,password\nA,p')[0]).not.toHaveProperty('passwordChangedAt')
    expect(csvToEntries('url,password,timePasswordChanged\na.com,p,bilinmiyor')[0]).not.toHaveProperty('passwordChangedAt')
  })
})
