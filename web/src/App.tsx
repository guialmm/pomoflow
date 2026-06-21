import { useState } from 'react'
import { Timer as TimerIcon, History, BarChart2, Settings } from 'lucide-react'
import { TimerProvider } from './context/TimerContext'
import TimerView from './components/Timer'
import HistoryView from './components/History'
import StatsView from './components/Stats'
import SettingsView from './components/Settings'
import MiniTimer from './components/MiniTimer'

type Tab = 'timer' | 'history' | 'stats' | 'settings'

const tabs: { id: Tab; label: string; Icon: typeof TimerIcon }[] = [
  { id: 'timer', label: 'Timer', Icon: TimerIcon },
  { id: 'history', label: 'History', Icon: History },
  { id: 'stats', label: 'Stats', Icon: BarChart2 },
  { id: 'settings', label: 'Settings', Icon: Settings },
]

function Shell() {
  const [tab, setTab] = useState<Tab>('timer')

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto">
      <header className="px-4 pt-6 pb-2">
        <h1 className="text-cyan-400 font-semibold text-lg tracking-tight">pomoflow</h1>
      </header>

      <main className="flex-1 overflow-y-auto">
        {tab === 'timer' && <TimerView />}
        {tab === 'history' && <HistoryView />}
        {tab === 'stats' && <StatsView />}
        {tab === 'settings' && <SettingsView />}
      </main>

      {/* mini timer shown when away from the timer tab */}
      {tab !== 'timer' && <MiniTimer onNavigate={() => setTab('timer')} />}

      <nav className="border-t border-slate-800 bg-slate-900/80 backdrop-blur sticky bottom-0">
        <div className="flex">
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs transition ${
                tab === id ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon size={20} />
              {label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}

export default function App() {
  return (
    <TimerProvider>
      <Shell />
    </TimerProvider>
  )
}
