import { useState, useCallback } from 'react'
import { Copy, Check, Trash2, Eye, EyeOff, Search, AlertTriangle, ShieldOff } from 'lucide-react'
import { copyToClipboard } from './utils/clipboard'

function timeAgo(dateStr) {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)

  if (diff < 60) return 'Az önce'
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`
  if (diff < 86400) return `${Math.floor(diff / 3600)} saat önce`
  if (diff < 172800) return 'Dün'
  if (diff < 604800) return `${Math.floor(diff / 86400)} gün önce`
  return new Date(dateStr).toLocaleDateString('tr-TR')
}

const charTypeLabels = {
  uppercase: 'A-Z',
  lowercase: 'a-z',
  numbers: '0-9',
  symbols: '#!@',
}

function HistoryRow({ item, onRemove }) {
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    await copyToClipboard(item.password)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [item.password])

  const maskedPassword = '\u2022'.repeat(Math.min(item.password.length, 20))

  const activeTypes = Object.entries(item.charTypes)
    .filter(([, v]) => v)
    .map(([k]) => charTypeLabels[k])

  return (
    <div className="password-card rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
      <div className="flex items-center gap-3 mb-3">
        <code className="flex-1 text-sm font-mono text-gray-100 bg-black/30 rounded-lg px-3 py-2 break-all select-all">
          {visible ? item.password : maskedPassword}
        </code>
        <button
          onClick={() => setVisible((v) => !v)}
          className="shrink-0 p-2.5 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all duration-200"
          title={visible ? 'Gizle' : 'Göster'}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
        <button
          onClick={handleCopy}
          className={`shrink-0 p-2.5 rounded-lg transition-all duration-200 ${
            copied
              ? 'bg-green-500/20 text-green-400'
              : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
          }`}
          title="Kopyala"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
        <button
          onClick={() => onRemove(item.id)}
          className="shrink-0 p-2.5 rounded-lg bg-white/5 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-all duration-200"
          title="Sil"
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: item.strength.color + '20',
            color: item.strength.color,
          }}
        >
          {item.strength.label}
        </span>
        <span className="text-xs text-gray-500">
          {item.length} karakter
        </span>
        <span className="text-xs text-gray-600">|</span>
        <span className="text-xs text-gray-500">
          {activeTypes.join(', ')}
        </span>
        <span className="text-xs text-gray-600 ml-auto">
          {timeAgo(item.date)}
        </span>
      </div>
    </div>
  )
}

export default function HistoryPanel({ history, removeFromHistory, clearHistory }) {
  const [search, setSearch] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  const filtered = search
    ? history.filter((item) => item.password.toLowerCase().includes(search.toLowerCase()))
    : history

  function handleClearAll() {
    clearHistory()
    setShowConfirm(false)
  }

  if (history.length === 0) {
    return (
      <div className="max-w-xl">
        <h1 className="text-2xl font-bold mb-6">Geçmiş</h1>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
            <ShieldOff size={28} className="text-gray-600" />
          </div>
          <p className="text-gray-400 font-medium mb-1">Henüz şifre oluşturmadınız</p>
          <p className="text-gray-600 text-sm">
            Oluşturduğunuz şifreler burada görünecek.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          Geçmiş
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({history.length} kayıt)
          </span>
        </h1>
        {!showConfirm ? (
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-all duration-200"
          >
            <Trash2 size={14} />
            Tümünü Temizle
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-400 flex items-center gap-1">
              <AlertTriangle size={12} />
              Emin misiniz?
            </span>
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
            >
              Evet, Sil
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-gray-400 hover:bg-white/10 transition-all"
            >
              İptal
            </button>
          </div>
        )}
      </div>

      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Şifrelerde ara..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 transition-all"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-gray-500 text-sm py-8">
          Aramayla eşleşen sonuç bulunamadı.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <HistoryRow
              key={item.id}
              item={item}
              onRemove={removeFromHistory}
            />
          ))}
        </div>
      )}
    </div>
  )
}
