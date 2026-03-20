import { useState, useCallback } from 'react'
import { Copy, Check, Trash2, Eye, EyeOff, Search, AlertTriangle, Lock, Unlock, KeyRound, ShieldAlert } from 'lucide-react'
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

function VaultRow({ item, onRemove }) {
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
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-indigo-400">{item.name}</span>
        <span className="text-xs text-gray-600">{timeAgo(item.date)}</span>
      </div>

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
      </div>
    </div>
  )
}

function SetupView({ onSetup, needsMigration }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.')
      return
    }
    if (password !== confirm) {
      setError('Şifreler eşleşmiyor.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await onSetup(password)
    } catch {
      setError('Bir hata oluştu. Tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Kasa</h1>
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-6">
          <KeyRound size={28} className="text-indigo-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-200 mb-2">Kasa Şifresi Belirle</h2>
        <p className="text-gray-500 text-sm text-center mb-6 max-w-sm">
          Kasanızdaki şifreler bu ana şifre ile şifrelenerek saklanacaktır.
        </p>

        {needsMigration && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs mb-6 max-w-sm">
            <ShieldAlert size={16} className="shrink-0" />
            <span>Mevcut kasanızdaki şifreler şifrelenecektir.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ana şifre"
            className="w-full px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 transition-all"
            autoFocus
          />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Ana şifreyi tekrarla"
            className="w-full px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 transition-all"
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 active:scale-[0.98] text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50"
          >
            {loading ? 'Ayarlanıyor...' : 'Kasayı Oluştur'}
          </button>
          <p className="text-xs text-gray-600 text-center">
            Bu şifreyi unutursanız kasanızdaki verilere erişemezsiniz.
          </p>
        </form>
      </div>
    </div>
  )
}

function LockedView({ onUnlock }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const success = await onUnlock(password)
      if (!success) {
        setError('Şifre yanlış.')
        setPassword('')
      }
    } catch {
      setError('Bir hata oluştu. Tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Kasa</h1>
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-6">
          <Lock size={28} className="text-gray-400" />
        </div>
        <h2 className="text-lg font-semibold text-gray-200 mb-2">Kasa Kilitli</h2>
        <p className="text-gray-500 text-sm text-center mb-6 max-w-sm">
          Kayıtlı şifrelerinizi görmek için ana şifrenizi girin.
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ana şifre"
            className="w-full px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 transition-all"
            autoFocus
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 active:scale-[0.98] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50"
          >
            <Unlock size={16} />
            {loading ? 'Açılıyor...' : 'Kilidi Aç'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function VaultPanel({
  passwords,
  removePassword,
  clearAll,
  isLocked,
  isInitialized,
  needsMigration,
  unlock,
  lock,
  setupMasterPassword,
}) {
  const [search, setSearch] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  // Kurulum gerekli — ilk kez veya migrasyon
  if (!isInitialized) {
    return <SetupView onSetup={setupMasterPassword} needsMigration={needsMigration} />
  }

  // Kilitli
  if (isLocked) {
    return <LockedView onUnlock={unlock} />
  }

  // Açık durum
  const filtered = search
    ? passwords.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))
    : passwords

  function handleClearAll() {
    clearAll()
    setShowConfirm(false)
  }

  if (passwords.length === 0) {
    return (
      <div className="max-w-xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Kasa</h1>
          <button
            onClick={lock}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all duration-200"
          >
            <Lock size={14} />
            Kilitle
          </button>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mb-4">
            <Lock size={28} className="text-gray-600" />
          </div>
          <p className="text-gray-400 font-medium mb-1">Kasanız boş</p>
          <p className="text-gray-600 text-sm">
            Şifre adı girerek oluşturduğunuz şifreler otomatik olarak kasaya kaydedilir.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          Kasa
          <span className="text-sm font-normal text-gray-500 ml-2">
            ({passwords.length} kayıt)
          </span>
        </h1>
        <div className="flex items-center gap-2">
          {!showConfirm ? (
            <>
              <button
                onClick={lock}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all duration-200"
              >
                <Lock size={14} />
                Kilitle
              </button>
              <button
                onClick={() => setShowConfirm(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-all duration-200"
              >
                <Trash2 size={14} />
                Tümünü Temizle
              </button>
            </>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>

      <div className="relative mb-5">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="İsme göre ara..."
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
            <VaultRow
              key={item.id}
              item={item}
              onRemove={removePassword}
            />
          ))}
        </div>
      )}
    </div>
  )
}
