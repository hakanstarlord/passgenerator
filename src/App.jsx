import { useState, useEffect, useCallback } from 'react'
import { Key, History, Lock, Maximize2, Minimize2, AlertTriangle, ArrowUpCircle, X } from 'lucide-react'
import GeneratorPanel from './GeneratorPanel'
import HistoryPanel from './HistoryPanel'
import VaultPanel from './VaultPanel'
import usePasswordHistory from './hooks/usePasswordHistory'
import useSavedPasswords from './hooks/useSavedPasswords'
import useAutoLock from './hooks/useAutoLock'

const tabs = [
  { id: 'generate', label: 'Oluştur', icon: Key },
  { id: 'vault', label: 'Kasa', icon: Lock },
  { id: 'history', label: 'Geçmiş', icon: History },
]

function App() {
  const [activeTab, setActiveTab] = useState('generate')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [updateInfo, setUpdateInfo] = useState(null)
  const [updateDismissed, setUpdateDismissed] = useState(false)
  const { history, addToHistory, removeFromHistory, clearHistory } = usePasswordHistory()
  const {
    savedPasswords, isLocked, isInitialized, needsMigration,
    unlock, lock, setupMasterPassword,
    savePassword, removePassword, clearAll: clearVault,
    updatePassword, importPasswords, restorePassword, getMasterPassword
  } = useSavedPasswords()

  const { showWarning: showAutoLockWarning, remainingSeconds: autoLockSeconds } = useAutoLock(isLocked, lock)

  const toggleFullscreen = useCallback(async () => {
    if (window.electronAPI) {
      await window.electronAPI.toggleFullscreen()
    } else {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    }
  }, [])

  useEffect(() => {
    if (window.electronAPI) {
      const handler = window.electronAPI.onFullscreenChange((value) => setIsFullscreen(value))
      return () => window.electronAPI.removeFullscreenListener(handler)
    } else {
      const handler = () => setIsFullscreen(!!document.fullscreenElement)
      document.addEventListener('fullscreenchange', handler)
      return () => document.removeEventListener('fullscreenchange', handler)
    }
  }, [])

  // Güncelleme kontrolü
  useEffect(() => {
    if (window.electronAPI?.checkForUpdates) {
      window.electronAPI.checkForUpdates()
        .then((info) => {
          if (info?.hasUpdate) setUpdateInfo(info)
        })
        .catch(() => {})
    }
  }, [])

  return (
    <div className="h-screen flex flex-col bg-[#0f0f0f] text-white overflow-hidden">
      {/* Update Banner */}
      {updateInfo?.hasUpdate && !updateDismissed && (
        <div className="px-4 py-2 bg-indigo-500/10 border-b border-indigo-500/20 text-indigo-400 text-xs flex items-center justify-center gap-2 shrink-0">
          <ArrowUpCircle size={14} />
          <span>Yeni sürüm mevcut: v{updateInfo.latestVersion}</span>
          <button
            onClick={() => window.electronAPI?.openExternal(updateInfo.releaseUrl)}
            className="px-2 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 font-medium transition-all"
          >
            GitHub&apos;da Görüntüle
          </button>
          <button
            onClick={() => setUpdateDismissed(true)}
            className="ml-auto p-0.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-all"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Title Bar */}
      <div className="flex items-center justify-between px-4 h-12 bg-[#16213e] border-b border-white/10 shrink-0">
        <span className="text-sm font-semibold tracking-wide flex items-center gap-2">
          <img src="./icon.png" alt="PassGen" className="w-5 h-5 object-contain" />
          PassGen
        </span>
        <button
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Tam ekrandan çık (F11)' : 'Tam ekran (F11)'}
          className="p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>

      {/* Auto-Lock Warning Banner */}
      {showAutoLockWarning && (
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-400 text-xs flex items-center justify-center gap-2 shrink-0">
          <AlertTriangle size={14} />
          <span>Hareketsizlik nedeniyle kasa {autoLockSeconds} saniye içinde kilitlenecek.</span>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[200px] bg-[#1a1a2e] border-r border-white/10 flex flex-col gap-1 p-3 shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-500/20 text-indigo-400 shadow-lg shadow-indigo-500/10'
                    : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            )
          })}
        </aside>

        {/* Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {activeTab === 'generate' && (
            <GeneratorPanel
              onGenerate={addToHistory}
              onSaveToVault={savePassword}
              isVaultLocked={isLocked}
              savedPasswords={savedPasswords}
            />
          )}
          {activeTab === 'vault' && (
            <VaultPanel
              passwords={savedPasswords}
              removePassword={removePassword}
              restorePassword={restorePassword}
              updatePassword={updatePassword}
              importPasswords={importPasswords}
              getMasterPassword={getMasterPassword}
              clearAll={clearVault}
              isLocked={isLocked}
              isInitialized={isInitialized}
              needsMigration={needsMigration}
              unlock={unlock}
              lock={lock}
              setupMasterPassword={setupMasterPassword}
            />
          )}
          {activeTab === 'history' && (
            <HistoryPanel
              history={history}
              removeFromHistory={removeFromHistory}
              clearHistory={clearHistory}
            />
          )}
        </main>
      </div>
    </div>
  )
}

export default App
