import { useState } from 'react'
import { Check, X, Eye, EyeOff, RefreshCw, AlertTriangle, Users, Landmark, Mail, ShoppingBag, Gamepad2, Briefcase, Tag } from 'lucide-react'
import { CATEGORIES } from './utils/categories'
import { calculateStrength, generatePassword } from './utils/passwordGenerator'
import { findDuplicatePassword } from './utils/duplicateCheck'
import { toSiteUrl } from './utils/siteUrl'

const categoryIcons = { Users, Landmark, Mail, ShoppingBag, Gamepad2, Briefcase, Tag }
const GENERATED_LENGTH = 16
const ALL_CHAR_TYPES = { uppercase: true, lowercase: true, numbers: true, symbols: true }

const inputClass = 'w-full px-3 py-2 rounded-lg bg-black/30 border border-white/[0.06] text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 transition-all'

// Kasa kaydı ekleme ve düzenleme için ortak form.
// onSubmit değerleri alır ve kayıt başarılıysa true döndürür.
export default function VaultEntryForm({ initial = {}, title, submitLabel = 'Kaydet', onSubmit, onCancel, savedPasswords = [] }) {
  const [name, setName] = useState(initial.name || '')
  const [username, setUsername] = useState(initial.username || '')
  const [url, setUrl] = useState(initial.url || '')
  const [password, setPassword] = useState(initial.password || '')
  const [category, setCategory] = useState(initial.category || 'other')
  const [notes, setNotes] = useState(initial.notes || '')
  // Yeni kayıtta şifre görünür başlar; mevcut kaydı düzenlerken gizli
  const [visible, setVisible] = useState(!initial.password)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const strength = password ? calculateStrength(password) : null
  const duplicateName = password
    ? findDuplicatePassword(password, savedPasswords.filter((entry) => entry.id !== initial.id))
    : null

  function handleGenerate() {
    setPassword(generatePassword(GENERATED_LENGTH, ALL_CHAR_TYPES))
    setVisible(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Ad boş bırakılamaz.')
      return
    }
    if (!password) {
      setError('Şifre boş bırakılamaz.')
      return
    }
    if (url.trim() && !toSiteUrl(url)) {
      setError('Geçerli bir site adresi girin (ör. ornek.com).')
      return
    }
    setError('')
    setSaving(true)
    const saved = await onSubmit({ name: name.trim(), username: username.trim(), url: url.trim(), password, category, notes })
    setSaving(false)
    if (saved === false) setError('Kaydedilemedi. Tekrar deneyin.')
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') onCancel()
  }

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      className="password-card rounded-xl bg-white/[0.03] border border-indigo-500/30 p-4 space-y-3"
    >
      {title && <h3 className="text-sm font-semibold text-gray-200">{title}</h3>}

      <div>
        <label className="text-xs text-gray-500 mb-1 block">Ad</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ör. Netflix, Banka"
          maxLength={60}
          className={inputClass}
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Kullanıcı adı (isteğe bağlı)</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ör. ali@ornek.com"
            maxLength={200}
            className={inputClass}
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Site (isteğe bağlı)</label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="ör. ornek.com"
            maxLength={500}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-500 mb-1 block">Şifre</label>
        <div className="flex items-center gap-2">
          <input
            type={visible ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${inputClass} font-mono`}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="shrink-0 p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-all"
            title={visible ? 'Gizle' : 'Göster'}
          >
            {visible ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            className="shrink-0 flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-white/5 text-gray-400 hover:bg-indigo-500/20 hover:text-indigo-400 text-xs font-medium transition-all"
            title={`${GENERATED_LENGTH} karakterlik güçlü bir şifre oluştur`}
          >
            <RefreshCw size={14} />
            Oluştur
          </button>
        </div>
        {strength && (
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${((strength.score + 1) / 5) * 100}%`, backgroundColor: strength.color }}
              />
            </div>
            <span className="text-xs font-medium" style={{ color: strength.color }}>{strength.label}</span>
          </div>
        )}
        {duplicateName && (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-400">
            <AlertTriangle size={12} className="shrink-0" />
            Bu şifre kasanızda zaten var: <strong>{duplicateName}</strong>
          </p>
        )}
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
                onClick={() => setCategory(cat.id)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                  category === cat.id
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

      <div>
        <label className="text-xs text-gray-500 mb-1 block">Not (isteğe bağlı)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="ör. güvenlik sorusu, kurtarma kodları"
          rows={2}
          maxLength={2000}
          className={`${inputClass} resize-y`}
        />
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="flex items-center gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 text-gray-400 hover:bg-white/10 transition-all"
        >
          <X size={14} />
          İptal
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition-all disabled:opacity-50"
        >
          <Check size={14} />
          {saving ? 'Kaydediliyor...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
