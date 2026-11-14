import { toSiteUrl } from './siteUrl'

// Tarayıcıların dışa aktardığı şifre CSV'leri için sütun adları (büyük/küçük harf duyarsız).
// Chrome/Edge: name,url,username,password[,note]  Firefox: url,username,password,...
const COLUMN_ALIASES = {
  name: ['name', 'title'],
  url: ['url', 'login_uri', 'website', 'site'],
  username: ['username', 'login_username', 'user', 'email'],
  password: ['password', 'login_password'],
  notes: ['note', 'notes', 'extra'],
}

// RFC 4180 CSV ayrıştırıcı: tırnaklı alanlar, "" kaçışı, alan içinde virgül ve satır sonu, CRLF/LF, BOM.
export function parseCsv(text) {
  const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
  const rows = []
  let row = []
  let field = ''
  let inQuotes = false
  let fieldStarted = false

  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    if (inQuotes) {
      if (ch === '"') {
        if (input[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else if (ch === '"' && !fieldStarted) {
      inQuotes = true
      fieldStarted = true
    } else if (ch === ',') {
      row.push(field)
      field = ''
      fieldStarted = false
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && input[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      fieldStarted = false
    } else {
      field += ch
      fieldStarted = true
    }
  }
  if (fieldStarted || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows.filter((cells) => cells.some((cell) => cell !== ''))
}

function nameFromUrl(url) {
  const href = toSiteUrl(url)
  return href ? new URL(href).hostname.replace(/^www\./, '') : ''
}

// CSV metnini kasa kaydı taslaklarına çevirir. Şifre sütunu yoksa hata fırlatır.
// Şifresi boş satırlar da döner; bunları normalizeVaultEntry atlar ve önizleme sayar.
export function csvToEntries(text) {
  const rows = parseCsv(typeof text === 'string' ? text : '')
  if (rows.length === 0) throw new Error('CSV dosyası boş.')

  const header = rows[0].map((cell) => cell.trim().toLowerCase())
  const columns = {}
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    const index = header.findIndex((cell) => aliases.includes(cell))
    if (index !== -1) columns[field] = index
  }
  if (columns.password === undefined) {
    throw new Error("Bu CSV dosyasında şifre sütunu bulunamadı. Chrome, Edge veya Firefox'tan dışa aktarılmış bir dosya seçin.")
  }

  return rows.slice(1).map((cells) => {
    const get = (field) => (columns[field] === undefined ? '' : (cells[columns[field]] ?? ''))
    const url = get('url').trim()
    const username = get('username').trim()
    return {
      name: get('name').trim() || nameFromUrl(url) || username,
      username,
      url,
      password: get('password'),
      notes: get('notes'),
      category: 'other',
    }
  })
}
