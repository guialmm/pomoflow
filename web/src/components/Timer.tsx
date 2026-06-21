import { Play, Pause, RotateCcw, Square, SkipForward } from 'lucide-react'
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

export default function Timer() {
  const { mode, phase, elapsed, remaining, total, task, sessionCount, setTask, start, pause, resume, stop, skipBreak } = useTimerContext()

  const pct = total > 0 ? elapsed / total : 0
  const radius = 88
  const circ = 2 * Math.PI * radius
  const dashOffset = circ * (1 - pct)
  const color = MODE_COLORS[mode]
  const isActive = phase === 'running' || phase === 'paused'
  const isDone = phase === 'done'
  const isBreak = mode !== 'pomodoro'

  return (
    <div className="flex flex-col items-center gap-6 py-8 px-4">
      {/* session count */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i < (sessionCount % 4) || (sessionCount % 4 === 0 && sessionCount > 0 && i === 3)
                ? 'bg-cyan-400'
                : 'bg-slate-700'
            }`}
          />
        ))}
        <span className="text-slate-500 text-xs ml-1">
          {sessionCount} {sessionCount === 1 ? 'session' : 'sessions'}
        </span>
      </div>

      {/* mode label */}
      <span className="text-sm font-medium" style={{ color }}>
        {MODE_LABELS[mode]}
      </span>

      {/* task input */}
      {!isBreak && (
        <input
          type="text"
          placeholder="What are you working on?"
          value={task}
          onChange={e => setTask(e.target.value)}
          disabled={isActive || isDone}
          className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 text-center focus:outline-none focus:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
        />
      )}

      {/* ring */}
      <div className="relative flex items-center justify-center">
        <svg width="220" height="220" className="-rotate-90">
          <circle cx="110" cy="110" r={radius} fill="none" stroke="#1e293b" strokeWidth="10" />
          <circle
            cx="110" cy="110" r={radius} fill="none"
            stroke={isDone ? '#22c55e' : color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.5s linear, stroke 0.3s' }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-5xl font-mono font-semibold text-slate-100 tabular-nums">
            {fmt(remaining)}
          </span>
          <span className="text-sm text-slate-400 mt-1">
            {isDone ? 'done' : phase === 'idle' ? `${Math.floor(total / 60)} min` : phase}
          </span>
        </div>
      </div>

      {/* controls */}
      <div className="flex gap-3">
        {phase === 'idle' && (
          <button
            onClick={start}
            className="flex items-center gap-2 text-slate-900 font-semibold px-8 py-3 rounded-xl transition"
            style={{ backgroundColor: color }}
          >
            <Play size={18} />
            {isBreak ? 'Start break' : 'Start'}
          </button>
        )}
        {phase === 'running' && (
          <>
            <button
              onClick={pause}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold px-6 py-3 rounded-xl transition"
            >
              <Pause size={18} />
              Pause
            </button>
            <button
              onClick={stop}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-400 px-4 py-3 rounded-xl transition"
            >
              <Square size={16} />
            </button>
          </>
        )}
        {phase === 'paused' && (
          <>
            <button
              onClick={resume}
              className="flex items-center gap-2 text-slate-900 font-semibold px-6 py-3 rounded-xl transition"
              style={{ backgroundColor: color }}
            >
              <Play size={18} />
              Resume
            </button>
            <button
              onClick={stop}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-400 px-4 py-3 rounded-xl transition"
            >
              <Square size={16} />
            </button>
          </>
        )}
        {isDone && isBreak && (
          <button
            onClick={skipBreak}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 px-5 py-3 rounded-xl transition text-sm"
          >
            <SkipForward size={16} />
            Skip break
          </button>
        )}
        {isDone && !isBreak && (
          <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
            <RotateCcw size={16} />
            Starting break…
          </div>
        )}
      </div>

      {isBreak && phase === 'idle' && (
        <div className="flex gap-2 items-center">
          <button
            onClick={skipBreak}
            className="text-slate-500 hover:text-slate-300 text-sm transition flex items-center gap-1"
          >
            <SkipForward size={14} />
            Skip break
          </button>
        </div>
      )}
    </div>
  )
}
