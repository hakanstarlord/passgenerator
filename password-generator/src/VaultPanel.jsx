import { useState, useCallback, useRef, useEffect } from 'react'
import { Copy, Check, Trash2, Eye, EyeOff, Search, AlertTriangle, Lock, Unlock, KeyRound, ShieldAlert, Pencil, X, Download, Upload, Timer, Shield, Users, Landmark, Mail, ShoppingBag, Gamepad2, Briefcase, Tag, Undo2 } from 'lucide-react'
import { copyToClipboard } from './utils/clipboard'
import { calculateStrength, calculateEntropy } from './utils/passwordGenerator'
import { exportVault, parseImportFile, decryptImportData } from './utils/exportImport'
import { flagDuplicateEntries } from './utils/duplicateCheck'
import { CATEGORIES, getCategoryLabel, getCategoryIcon } from './utils/categories'
import useUnlockRateLimit from './hooks/useUnlockRateLimit'
import useUndoDelete from './hooks/useUndoDelete'

const categoryIcons = { Users, Landmark, Mail, ShoppingBag, Gamepad2, Briefcase, Tag }

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

function VaultRow({ item, onRemove, isEditing, onStartEdit, onCancelEdit, onSaveEdit }) {
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)
  const [editName, setEditName] = useState(item.name)
  const [editPassword, setEditPassword] = useState(item.password)
  const [editCategory, setEditCategory] = useState(item.category || 'other')
  const [editError, setEditError] = useState('')

  const handleCopy = useCallback(async () => {
    await copyToClipboard(item.password)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [item.password])

  const handleSave = useCallback(() => {
    const trimmedName = editName.trim()
    const trimmedPassword = editPassword.trim()
    if (!trimmedName || !trimmedPassword) {
      setEditError('Ad ve şifre boş bırakılamaz.')
      return
    }
    onSaveEdit(item.id, { name: trimmedName, password: trimmedPassword, category: editCategory })
    setEditError('')
  }, [editName, editPassword, editCategory, item.id, onSaveEdit])

  const handleCancel = useCallback(() => {
    setEditName(item.name)
    setEditPassword(item.password)
    setEditCategory(item.category || 'other')
    setEditError('')
    onCancelEdit()
  }, [item.name, item.password, item.category, onCancelEdit])

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') handleCancel()
    if (e.key === 'Enter') handleSave()
  }, [handleCancel, handleSave])

  const maskedPassword = '\u2022'.repeat(Math.min(item.password.length, 20))

  const activeTypes = Object.entries(item.charTypes)
    .filter(([, v]) => v)
    .map(([k]) => charTypeLabels[k])

  if (isEditing) {
    return (
      <div className="password-card rounded-xl bg-white/[0.03] border border-indigo-500/30 p-4">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Ad</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/[0.06] text-sm text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all"
              autoFocus
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Şifre</label>
            <input
              type={visible ? 'text' : 'password'}
              value={editPassword}
              onChange={(e) => setEditPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-3 py-2 rounded-lg bg-black/30 border border-white/[0.06] text-sm font-mono text-gray-200 focus:outline-none focus:border-indigo-500/50 transition-all"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Kategori</label>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => {
                const CatIcon = categoryIcons[cat.icon]
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setEditCategory(cat.id)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                      editCategory === cat.id
                        ? 'bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/30'
                        : 'bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:bg-white/[0.06]'
                    }`}
                  >
                    <CatIcon size={12} />
                    {cat.label}
                  </button>
                )
              })}
            </div>
          </div>
          {editError && <p className="text-xs text-red-400">{editError}</p>}
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => setVisible(v => !v)}
              className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all"
              title={visible ? 'Gizle' : 'Göster'}
            >
              {visible ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-gray-400 hover:bg-white/10 transition-all"
            >
              <X size={14} />
              İptal
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-all"
            >
              <Check size={14} />
              Kaydet
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="password-card rounded-xl bg-white/[0.03] border border-white/[0.06] p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-indigo-400">{item.name}</span>
          {(() => {
            const iconName = getCategoryIcon(item.category || 'other')
            const CatIcon = categoryIcons[iconName]
            return CatIcon ? (
              <span className="flex items-center gap-1 text-xs text-gray-500 bg-white/[0.03] px-1.5 py-0.5 rounded">
                <CatIcon size={11} />
                {getCategoryLabel(item.category || 'other')}
              </span>
            ) : null
          })()}
        </div>
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
          onClick={() => onStartEdit(item.id)}
          className="shrink-0 p-2.5 rounded-lg bg-white/5 text-gray-400 hover:bg-indigo-500/20 hover:text-indigo-400 transition-all duration-200"
          title="Düzenle"
        >
          <Pencil size={16} />
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
        {item.charTypes && (
          <span className="flex items-center gap-1 text-xs text-gray-500 font-mono">
            <Shield size={12} className="text-gray-600" />
            ~{calculateEntropy(item.length, item.charTypes)} bit
          </span>
        )}
      </div>
    </div>
  )
}

function SetupView({ onSetup, needsMigration }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const strength = password ? calculateStrength(password) : null
  const isWeak = strength && strength.score < 2

  async function handleSubmit(e) {
    e.preventDefault()
    if (isWeak) {
      setError('Ana şifre en az "Orta" güçte olmalıdır.')
      return
    }
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

          {strength && (
            <div className="space-y-1.5">
              <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${((strength.score + 1) / 5) * 100}%`,
                    backgroundColor: strength.color,
                  }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium" style={{ color: strength.color }}>
                  {strength.label}
                </span>
                {isWeak && (
                  <span className="text-xs text-red-400">En az &quot;Orta&quot; güçte olmalıdır</span>
                )}
              </div>
            </div>
          )}

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
            disabled={loading || isWeak}
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
  const { canAttempt, remainingTime, failedAttempts, recordFailure, recordSuccess } = useUnlockRateLimit()

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canAttempt) return
    setLoading(true)
    setError('')
    try {
      const success = await onUnlock(password)
      if (success) {
        recordSuccess()
      } else {
        recordFailure()
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

        {!canAttempt && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs mb-4 max-w-sm">
            <Timer size={16} className="shrink-0" />
            <span>
              Çok fazla başarısız deneme. {formatTime(remainingTime)} bekleyin.
            </span>
          </div>
        )}

        {canAttempt && failedAttempts >= 3 && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs mb-4 max-w-sm">
            <AlertTriangle size={16} className="shrink-0" />
            <span>
              {failedAttempts} başarısız deneme. {failedAttempts >= 8 ? '10' : '5'} denemede kilitlenecek.
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Ana şifre"
            disabled={!canAttempt}
            className="w-full px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 transition-all disabled:opacity-50"
            autoFocus
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={loading || !canAttempt}
            className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 active:scale-[0.98] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50"
          >
            <Unlock size={16} />
            {!canAttempt ? `Bekleyin (${formatTime(remainingTime)})` : loading ? 'Açılıyor...' : 'Kilidi Aç'}
          </button>
        </form>
      </div>
    </div>
  )
}

function ImportModal({ onImport, onClose, savedPasswords }) {
  const [step, setStep] = useState('file')
  const [fileData, setFileData] = useState(null)
  const [password, setPassword] = useState('')
  const [entries, setEntries] = useState([])
  const [mode, setMode] = useState('merge')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [replaceConfirm, setReplaceConfirm] = useState(false)
  const fileInputRef = useRef(null)

  async function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    try {
      const parsed = await parseImportFile(file)
      setFileData(parsed)
      setStep('password')
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDecrypt(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const decrypted = await decryptImportData(fileData, password)
      const flagged = flagDuplicateEntries(decrypted, savedPasswords)
      setEntries(flagged)
      setStep('preview')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function handleImport() {
    if (mode === 'replace' && !replaceConfirm) {
      setReplaceConfirm(true)
      return
    }
    onImport(entries, mode)
    onClose()
  }

  const duplicateCount = entries.filter(e => e.isDuplicate).length

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[#1a1a2e] border border-white/10 p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-200">İçe Aktar</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {step === 'file' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              Daha önce dışa aktarılmış bir <code className="text-indigo-400">.passgen</code> dosyası seçin.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".passgen"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 rounded-xl bg-white/5 border border-white/[0.06] text-gray-300 hover:bg-white/10 transition-all text-sm font-medium flex items-center justify-center gap-2"
            >
              <Upload size={16} />
              Dosya Seç
            </button>
            {error && <p className="text-xs text-red-400">{error}</p>}
          </div>
        )}

        {step === 'password' && (
          <form onSubmit={handleDecrypt} className="space-y-4">
            <p className="text-sm text-gray-400">
              Dosya oluşturulma tarihi: {new Date(fileData.exportDate).toLocaleDateString('tr-TR')}
              <br />
              Kayıt sayısı: {fileData.count}
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Dosyanın şifresini girin"
              className="w-full px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 transition-all"
              autoFocus
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50"
            >
              {loading ? 'Çözümleniyor...' : 'Şifreyi Çöz'}
            </button>
          </form>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              {entries.length} kayıt bulundu.
              {duplicateCount > 0 && (
                <span className="text-amber-400"> ({duplicateCount} adet mevcut kasanızla eşleşiyor)</span>
              )}
            </p>

            <div className="max-h-48 overflow-y-auto space-y-2">
              {entries.map((entry, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
                    entry.isDuplicate
                      ? 'bg-amber-500/10 border border-amber-500/20'
                      : 'bg-white/[0.03] border border-white/[0.06]'
                  }`}
                >
                  <span className="text-gray-200">{entry.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">{entry.length} kar.</span>
                    {entry.isDuplicate && <span className="text-amber-400">Mevcut</span>}
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400 block">İçe aktarma modu</label>
              <div className="flex gap-2">
                <button
                  onClick={() => { setMode('merge'); setReplaceConfirm(false) }}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    mode === 'merge'
                      ? 'bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/30'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  Birleştir
                </button>
                <button
                  onClick={() => { setMode('replace'); setReplaceConfirm(false) }}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                    mode === 'replace'
                      ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  Değiştir
                </button>
              </div>
              <p className="text-xs text-gray-600">
                {mode === 'merge'
                  ? 'Mevcut kayıtlar korunur, yalnızca yeni şifreler eklenir.'
                  : 'Mevcut tüm kayıtlar silinir, dosyadaki kayıtlarla değiştirilir.'}
              </p>
            </div>

            {replaceConfirm && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                <AlertTriangle size={16} className="shrink-0" />
                <span>Bu işlem mevcut tüm kayıtlarınızı silecek. Emin misiniz?</span>
              </div>
            )}

            <button
              onClick={handleImport}
              className={`w-full py-3 rounded-xl font-semibold text-sm transition-all shadow-lg ${
                replaceConfirm
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/25'
                  : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/25'
              }`}
            >
              {replaceConfirm ? 'Evet, Değiştir' : mode === 'merge' ? 'Birleştir' : 'Değiştir'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function VaultPanel({
  passwords,
  removePassword,
  restorePassword,
  updatePassword,
  importPasswords,
  getMasterPassword,
  clearAll,
  isLocked,
  isInitialized,
  needsMigration,
  unlock,
  lock,
  setupMasterPassword,
}) {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showConfirm, setShowConfirm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [showImport, setShowImport] = useState(false)
  const { pendingDeletes, softDelete, undoDelete, clearAll: clearUndoBuffer } = useUndoDelete()

  // Kasa kilitlenince undo buffer'ını temizle
  useEffect(() => {
    if (isLocked) clearUndoBuffer()
  }, [isLocked, clearUndoBuffer])

  function handleSoftDelete(id) {
    const item = passwords.find(p => p.id === id)
    if (!item) return
    removePassword(id)
    softDelete(item)
  }

  function handleUndo(id) {
    const restored = undoDelete(id)
    if (restored) restorePassword(restored)
  }

  if (!isInitialized) {
    return <SetupView onSetup={setupMasterPassword} needsMigration={needsMigration} />
  }

  if (isLocked) {
    return <LockedView onUnlock={unlock} />
  }

  const filtered = passwords.filter((item) => {
    const matchesSearch = !search || item.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || (item.category || 'other') === categoryFilter
    return matchesSearch && matchesCategory
  })

  const categoryCounts = passwords.reduce((acc, item) => {
    const cat = item.category || 'other'
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {})

  function handleClearAll() {
    clearAll()
    setShowConfirm(false)
  }

  function handleSaveEdit(id, updates) {
    updatePassword(id, updates)
    setEditingId(null)
  }

  async function handleExport() {
    const masterPassword = getMasterPassword()
    if (!masterPassword) return
    await exportVault(passwords, masterPassword)
  }

  function handleImport(entries, mode) {
    importPasswords(entries, mode)
  }

  if (passwords.length === 0) {
    return (
      <div className="max-w-xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Kasa</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all duration-200"
            >
              <Upload size={14} />
              İçe Aktar
            </button>
            <button
              onClick={lock}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all duration-200"
            >
              <Lock size={14} />
              Kilitle
            </button>
          </div>
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
        {showImport && (
          <ImportModal
            onImport={handleImport}
            onClose={() => setShowImport(false)}
            savedPasswords={passwords}
          />
        )}
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
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all duration-200"
              >
                <Download size={14} />
                Dışa Aktar
              </button>
              <button
                onClick={() => setShowImport(true)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all duration-200"
              >
                <Upload size={14} />
                İçe Aktar
              </button>
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

      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="İsme göre ara..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 transition-all"
        />
      </div>

      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            categoryFilter === 'all'
              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50'
              : 'bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:bg-white/[0.06]'
          }`}
        >
          Tümü ({passwords.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = categoryCounts[cat.id] || 0
          if (count === 0) return null
          const CatIcon = categoryIcons[cat.icon]
          return (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                categoryFilter === cat.id
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/50'
                  : 'bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:bg-white/[0.06]'
              }`}
            >
              <CatIcon size={12} />
              {cat.label} ({count})
            </button>
          )
        })}
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
              onRemove={handleSoftDelete}
              isEditing={editingId === item.id}
              onStartEdit={(id) => setEditingId(id)}
              onCancelEdit={() => setEditingId(null)}
              onSaveEdit={handleSaveEdit}
            />
          ))}
        </div>
      )}

      {showImport && (
        <ImportModal
          onImport={handleImport}
          onClose={() => setShowImport(false)}
          savedPasswords={passwords}
        />
      )}

      {/* Undo toast */}
      {pendingDeletes.length > 0 && (
        <div className="fixed bottom-6 right-6 z-40 flex flex-col gap-2">
          {pendingDeletes.map(({ item, remainingSeconds }) => (
            <div
              key={item.id}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#1a1a2e] border border-white/10 shadow-xl shadow-black/30 animate-slide-up"
            >
              <span className="text-sm text-gray-300 max-w-[200px] truncate">
                &ldquo;{item.name}&rdquo; silindi
              </span>
              <button
                onClick={() => handleUndo(item.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-all shrink-0"
              >
                <Undo2 size={12} />
                Geri Al ({remainingSeconds}s)
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
