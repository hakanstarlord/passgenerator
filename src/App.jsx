import { useState } from 'react'
import { Key, History } from 'lucide-react'
import GeneratorPanel from './GeneratorPanel'
import HistoryPanel from './HistoryPanel'
import usePasswordHistory from './hooks/usePasswordHistory'

const tabs = [
  { id: 'generate', label: 'Oluştur', icon: Key },
  { id: 'history', label: 'Geçmiş', icon: History },
]

function App() {
  const [activeTab, setActiveTab] = useState('generate')
  const { history, addToHistory, removeFromHistory, clearHistory } = usePasswordHistory()

  return (
    <div className="h-screen flex flex-col bg-[#0f0f0f] text-white overflow-hidden">
      {/* Title Bar */}
      <div className="flex items-center px-4 h-12 bg-[#16213e] border-b border-white/10 shrink-0">
        <span className="text-sm font-semibold tracking-wide flex items-center gap-2">
          <img src="./icon.png" alt="PassGen" className="w-5 h-5 object-contain" />
          PassGen
        </span>
      </div>

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
          {activeTab === 'generate' && <GeneratorPanel onGenerate={addToHistory} />}
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
