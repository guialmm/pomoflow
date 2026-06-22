import { Play, Pause, Square, SkipForward, PictureInPicture2, Coffee, BookOpen, Moon } from 'lucide-react'
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
  const {
    mode, phase, elapsed, remaining, total, task, sessionCount,
    pipSupported, setTask, start, pause, resume, stop, skipBreak,
    startBreak, returnToStudy, togglePiP,
  } = useTimerContext()

  const pct = total > 0 ? elapsed / total : 0
  const radius = 88
  const circ = 2 * Math.PI * radius
  const dashOffset = circ * (1 - pct)
  const color = MODE_COLORS[mode]
  const isActive = phase === 'running' || phase === 'paused'
  const isDone = phase === 'done'
  const isBreak = mode !== 'pomodoro'

  // dots: 4 per cycle (classic Pomodoro — long break every 4 sessions)
  const dotsFilled = sessionCount % 4
  const nextBreakIsLong = !isBreak && isDone && sessionCount % 4 === 0

  return (
    <div className="flex flex-col items-center gap-6 py-8 px-4">
      {/* pip button */}
      {pipSupported && isActive && (
        <div className="self-end">
          <button
            onClick={togglePiP}
            title="Pop out timer"
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-xs transition px-2 py-1 rounded-lg hover:bg-slate-800"
          >
            <PictureInPicture2 size={14} />
            Pop out
          </button>
        </div>
      )}

      {/* session dots + count */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${i < dotsFilled ? 'bg-cyan-400' : 'bg-slate-700'}`}
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
            <button onClick={stop} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-400 px-4 py-3 rounded-xl transition">
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
            <button onClick={stop} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-400 px-4 py-3 rounded-xl transition">
              <Square size={16} />
            </button>
          </>
        )}

        {/* pomodoro done → 4th gets long break, others get short break */}
        {isDone && !isBreak && (
          <button
            onClick={startBreak}
            className="flex items-center gap-2 text-slate-900 font-semibold px-7 py-3 rounded-xl transition"
            style={{ backgroundColor: nextBreakIsLong ? '#a78bfa' : '#22c55e' }}
          >
            {nextBreakIsLong ? <Moon size={18} /> : <Coffee size={18} />}
            {nextBreakIsLong ? 'Start long break' : 'Start break'}
          </button>
        )}

        {/* break done → back to studying */}
        {isDone && isBreak && (
          <button
            onClick={returnToStudy}
            className="flex items-center gap-2 text-slate-900 font-semibold px-7 py-3 rounded-xl transition"
            style={{ backgroundColor: '#06b6d4' }}
          >
            <BookOpen size={18} />
            Back to studying
          </button>
        )}
      </div>

      {/* skip break while idle */}
      {isBreak && phase === 'idle' && (
        <button
          onClick={skipBreak}
          className="text-slate-500 hover:text-slate-300 text-sm transition flex items-center gap-1"
        >
          <SkipForward size={14} />
          Skip break
        </button>
      )}
    </div>
  )
}
