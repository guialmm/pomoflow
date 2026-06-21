import { Play, Pause } from 'lucide-react'
import { useTimerContext } from '../context/TimerContext'
import type { TimerMode } from '../context/TimerContext'

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const MODE_LABELS: Record<TimerMode, string> = {
  'pomodoro': 'Focus',
  'short-break': 'Short break',
  'long-break': 'Long break',
}

const MODE_COLORS: Record<TimerMode, string> = {
  'pomodoro': '#06b6d4',
  'short-break': '#22c55e',
  'long-break': '#a78bfa',
}

interface Props {
  onNavigate: () => void
}

export default function MiniTimer({ onNavigate }: Props) {
  const { mode, phase, remaining, task, pause, resume } = useTimerContext()

  if (phase === 'idle') return null

  const color = MODE_COLORS[mode]

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (phase === 'running') pause()
    else if (phase === 'paused') resume()
  }

  return (
    <div
      onClick={onNavigate}
      className="mx-3 mb-2 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 flex items-center justify-between cursor-pointer active:bg-slate-750 transition shadow-lg"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{
            backgroundColor: color,
            boxShadow: phase === 'running' ? `0 0 6px ${color}` : 'none',
            animation: phase === 'running' ? 'pulse 2s infinite' : 'none',
          }}
        />
        <div className="min-w-0">
          <p className="text-xs font-medium" style={{ color }}>{MODE_LABELS[mode]}</p>
          <p className="text-slate-300 text-sm truncate">
            {task || (mode === 'pomodoro' ? 'Pomodoro' : 'Break')}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span className="text-lg font-mono font-semibold text-slate-100 tabular-nums">
          {fmt(remaining)}
        </span>
        {(phase === 'running' || phase === 'paused') && (
          <button
            onClick={handleAction}
            className="w-8 h-8 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center transition"
          >
            {phase === 'running'
              ? <Pause size={14} className="text-slate-200" />
              : <Play size={14} className="text-slate-200" />
            }
          </button>
        )}
      </div>
    </div>
  )
}
