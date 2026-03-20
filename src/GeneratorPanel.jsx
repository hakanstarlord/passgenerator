import { useState, useCallback } from 'react'
import { Sparkles, Plus, Minus, Copy, Check, ClipboardList, Landmark, Wifi, AtSign, Mail, Hash } from 'lucide-react'
import { generatePassword, calculateStrength } from './utils/passwordGenerator'
import { copyToClipboard } from './utils/clipboard'

const charOptions = [
  { id: 'uppercase', label: 'Büyük harfler', desc: 'A-Z' },
  { id: 'lowercase', label: 'Küçük harfler', desc: 'a-z' },
  { id: 'numbers', label: 'Rakamlar', desc: '0-9' },
  { id: 'symbols', label: 'Özel karakterler', desc: '!@#$%^&*' },
]

const quickLengths = [8, 12, 16, 24, 32]

const profileIcons = { Landmark, Wifi, AtSign, Mail, Hash }

const PRESET_PROFILES = [
  { id: 'bank', name: 'Banka', icon: 'Landmark', length: 16, count: 1, charTypes: { uppercase: true, lowercase: true, numbers: true, symbols: true } },
  { id: 'wifi', name: 'Wi-Fi', icon: 'Wifi', length: 24, count: 1, charTypes: { uppercase: true, lowercase: true, numbers: true, symbols: false } },
  { id: 'social', name: 'Sosyal Medya', icon: 'AtSign', length: 14, count: 1, charTypes: { uppercase: true, lowercase: true, numbers: true, symbols: true } },
  { id: 'email', name: 'E-posta', icon: 'Mail', length: 16, count: 1, charTypes: { uppercase: true, lowercase: true, numbers: true, symbols: false } },
  { id: 'pin', name: 'PIN', icon: 'Hash', length: 6, count: 1, charTypes: { uppercase: false, lowercase: false, numbers: true, symbols: false } },
]

function ToggleSwitch({ enabled, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
        enabled ? 'bg-indigo-500' : 'bg-gray-700'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-200 mt-0.5 ${
          enabled ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

function PasswordCard({ value, strength, index }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    await copyToClipboard(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [value])

  const barWidth = ((strength.score + 1) / 5) * 100

  return (
    <div
      className="password-card rounded-xl bg-white/[0.03] border border-white/[0.06] p-4"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="flex items-center gap-3 mb-3">
        <code className="flex-1 text-sm font-mono text-gray-100 bg-black/30 rounded-lg px-3 py-2 break-all select-all">
          {value}
        </code>
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
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="strength-bar-fill h-full rounded-full transition-colors duration-300"
            style={{
              width: `${barWidth}%`,
              backgroundColor: strength.color,
              animationDelay: `${index * 80 + 200}ms`,
            }}
          />
        </div>
        <span
          className="text-xs font-medium shrink-0 w-20 text-right"
          style={{ color: strength.color }}
        >
          {strength.label}
        </span>
      </div>

      {copied && (
        <div className="mt-2 text-xs text-green-400 font-medium animate-pulse">
          Kopyalandı ✓
        </div>
      )}
    </div>
  )
}

export default function GeneratorPanel({ onGenerate, onSaveToVault, isVaultLocked }) {
  const [length, setLength] = useState(16)
  const [count, setCount] = useState(1)
  const [charTypes, setCharTypes] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  })

  const [passwords, setPasswords] = useState([])
  const [copiedAll, setCopiedAll] = useState(false)
  const [vaultName, setVaultName] = useState('')
  const [savedToVault, setSavedToVault] = useState(false)
  const [vaultWarning, setVaultWarning] = useState(false)
  const activeCount = Object.values(charTypes).filter(Boolean).length

  const activeProfile = PRESET_PROFILES.find((p) =>
    p.length === length &&
    p.count === count &&
    p.charTypes.uppercase === charTypes.uppercase &&
    p.charTypes.lowercase === charTypes.lowercase &&
    p.charTypes.numbers === charTypes.numbers &&
    p.charTypes.symbols === charTypes.symbols
  )

  const applyProfile = useCallback((profile) => {
    setLength(profile.length)
    setCount(profile.count)
    setCharTypes({ ...profile.charTypes })
  }, [])

  function toggleCharType(id) {
    if (charTypes[id] && activeCount <= 1) return
    setCharTypes((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  function handleGenerate() {
    const generated = Array.from({ length: count }, () => {
      const value = generatePassword(length, charTypes)
      const strength = calculateStrength(value)
      return { value, strength }
    })
    setPasswords(generated)
    setCopiedAll(false)

    const savingToVault = vaultName.trim() && !isVaultLocked

    // Kasaya kaydedilen şifreleri geçmişe ekleme
    if (!savingToVault) {
      const historyEntries = generated.map((pw) => ({
        id: crypto.randomUUID(),
        password: pw.value,
        strength: pw.strength,
        length,
        date: new Date().toISOString(),
        charTypes: { ...charTypes },
      }))
      onGenerate?.(historyEntries)
    }

    if (vaultName.trim()) {
      if (isVaultLocked) {
        setVaultWarning(true)
        setTimeout(() => setVaultWarning(false), 3000)
      } else {
        generated.forEach((pw, i) => {
          onSaveToVault?.({
            id: crypto.randomUUID(),
            name: count > 1 ? `${vaultName.trim()} (${i + 1})` : vaultName.trim(),
            password: pw.value,
            strength: pw.strength,
            length,
            charTypes: { ...charTypes },
            date: new Date().toISOString(),
          })
        })
        setSavedToVault(true)
        setTimeout(() => setSavedToVault(false), 2000)
        setVaultName('')
      }
    }
  }

  async function handleCopyAll() {
    const text = passwords.map((p) => p.value).join('\n')
    await copyToClipboard(text)
    setCopiedAll(true)
    setTimeout(() => setCopiedAll(false), 1500)
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold mb-6">Şifre Oluştur</h1>

      {/* Profiles */}
      <section className="mb-8">
        <label className="text-sm font-medium text-gray-300 block mb-3">Profiller</label>
        <div className="flex flex-wrap gap-2">
          {PRESET_PROFILES.map((profile) => {
            const Icon = profileIcons[profile.icon]
            const isActive = activeProfile?.id === profile.id
            return (
              <button
                key={profile.id}
                onClick={() => applyProfile(profile)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/30'
                    : 'bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:bg-white/[0.06] hover:text-gray-200'
                }`}
                title={`${profile.length} karakter, ${profile.count} adet`}
              >
                <Icon size={14} />
                {profile.name}
              </button>
            )
          })}
        </div>
      </section>

      {/* Length */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-gray-300">Şifre Uzunluğu</label>
          <span className="text-2xl font-bold text-indigo-400 tabular-nums w-12 text-right">
            {length}
          </span>
        </div>

        <input
          type="range"
          min={4}
          max={128}
          value={length}
          onChange={(e) => setLength(Number(e.target.value))}
          className="w-full"
        />

        <div className="flex gap-2 mt-3">
          {quickLengths.map((val) => (
            <button
              key={val}
              onClick={() => setLength(val)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                length === val
                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200'
              }`}
            >
              {val}
            </button>
          ))}
        </div>
      </section>

      {/* Character types */}
      <section className="mb-8">
        <label className="text-sm font-medium text-gray-300 block mb-3">Karakter Türleri</label>
        <div className="space-y-2">
          {charOptions.map((opt) => {
            const enabled = charTypes[opt.id]
            const isLast = enabled && activeCount <= 1
            return (
              <div
                key={opt.id}
                className="flex items-center justify-between px-4 py-3 rounded-lg bg-white/[0.03] border border-white/[0.06]"
              >
                <div>
                  <span className="text-sm text-gray-200">{opt.label}</span>
                  <span className="text-xs text-gray-500 ml-2">{opt.desc}</span>
                </div>
                <ToggleSwitch
                  enabled={enabled}
                  onChange={() => toggleCharType(opt.id)}
                  disabled={isLast}
                />
              </div>
            )
          })}
        </div>
      </section>

      {/* Count */}
      <section className="mb-8">
        <label className="text-sm font-medium text-gray-300 block mb-3">Adet</label>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCount((c) => Math.max(1, c - 1))}
            disabled={count <= 1}
            className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Minus size={16} />
          </button>
          <span className="text-lg font-bold tabular-nums w-8 text-center">{count}</span>
          <button
            onClick={() => setCount((c) => Math.min(10, c + 1))}
            disabled={count >= 10}
            className="p-2 rounded-lg bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
          </button>
        </div>
      </section>

      {/* Vault name */}
      <section className="mb-5">
        <label className="text-sm font-medium text-gray-300 block mb-2">Kasaya Kaydet (isteğe bağlı)</label>
        <input
          type="text"
          value={vaultName}
          onChange={(e) => setVaultName(e.target.value)}
          placeholder="Şifre adı girin (ör: Netflix, Banka)..."
          maxLength={30}
          className="w-full px-4 py-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/25 transition-all"
        />
        <p className="text-xs text-gray-600 mt-1.5">Ad girilirse şifre otomatik olarak kasaya kaydedilir.</p>
      </section>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        className="w-full py-3.5 rounded-xl bg-indigo-500 hover:bg-indigo-600 active:scale-[0.98] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/25"
      >
        <Sparkles size={18} />
        Şifre Oluştur
      </button>

      {savedToVault && (
        <div className="mt-3 text-center text-sm text-green-400 font-medium animate-pulse">
          Kasaya kaydedildi ✓
        </div>
      )}

      {vaultWarning && (
        <div className="mt-3 text-center text-sm text-amber-400 font-medium animate-pulse">
          Kasa kilitli — kaydetmek için önce kasanın kilidini açın.
        </div>
      )}

      {/* Results */}
      {passwords.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-200">
              Sonuçlar
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({passwords.length} şifre)
              </span>
            </h2>
            {passwords.length > 1 && (
              <button
                onClick={handleCopyAll}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  copiedAll
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                {copiedAll ? <Check size={14} /> : <ClipboardList size={14} />}
                {copiedAll ? 'Kopyalandı ✓' : 'Tümünü Kopyala'}
              </button>
            )}
          </div>

          <div className="space-y-3">
            {passwords.map((pw, i) => (
              <PasswordCard
                key={`${pw.value}-${i}`}
                value={pw.value}
                strength={pw.strength}
                index={i}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
