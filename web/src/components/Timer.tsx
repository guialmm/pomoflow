import { useEffect, useState } from 'react'
import { Play, Pause, RotateCcw, Square } from 'lucide-react'
import { useTimer } from '../hooks/useTimer'
import { saveSession, loadConfig } from '../lib/storage'

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function Timer() {
  const config = loadConfig()
  const [task, setTask] = useState('')
  const [startedAt, setStartedAt] = useState('')
  const { state, elapsed, remaining, start, pause, resume, reset } = useTimer(config.pomodoro_minutes)

  const total = config.pomodoro_minutes * 60
  const pct = total > 0 ? elapsed / total : 0
  const radius = 88
  const circ = 2 * Math.PI * radius
  const dashOffset = circ * (1 - pct)

  useEffect(() => {
    if (state === 'done') {
      saveSession({
        started_at: startedAt,
        duration_minutes: config.pomodoro_minutes,
        elapsed_seconds: elapsed,
        completed: true,
        task,
      })
      new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAA').play().catch(() => {})
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('pomoflow', { body: task ? `${task} complete!` : 'Session complete! Take a break.' })
      }
    }
  }, [state])

  const handleStart = () => {
    setStartedAt(new Date().toISOString())
    start()
  }

  const handleStop = () => {
    if (state === 'running' || state === 'paused') {
      saveSession({
        started_at: startedAt,
        duration_minutes: config.pomodoro_minutes,
        elapsed_seconds: elapsed,
        completed: false,
        task,
      })
    }
    reset()
  }

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const isActive = state === 'running' || state === 'paused'
  const isDone = state === 'done'

  return (
    <div className="flex flex-col items-center gap-8 py-10 px-4">
      {/* task input */}
      <input
        type="text"
        placeholder="What are you working on?"
        value={task}
        onChange={e => setTask(e.target.value)}
        disabled={isActive || isDone}
        className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 text-center focus:outline-none focus:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
      />

      {/* ring */}
      <div className="relative flex items-center justify-center">
        <svg width="220" height="220" className="-rotate-90">
          <circle cx="110" cy="110" r={radius} fill="none" stroke="#1e293b" strokeWidth="10" />
          <circle
            cx="110" cy="110" r={radius} fill="none"
            stroke={isDone ? '#22c55e' : '#06b6d4'}
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
            {isDone ? 'done' : state === 'idle' ? `${config.pomodoro_minutes} min` : state}
          </span>
        </div>
      </div>

      {/* controls */}
      <div className="flex gap-4">
        {state === 'idle' && (
          <button
            onClick={handleStart}
            className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold px-8 py-3 rounded-xl transition"
          >
            <Play size={18} />
            Start
          </button>
        )}
        {state === 'running' && (
          <>
            <button
              onClick={pause}
              className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold px-6 py-3 rounded-xl transition"
            >
              <Pause size={18} />
              Pause
            </button>
            <button
              onClick={handleStop}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-400 px-4 py-3 rounded-xl transition"
            >
              <Square size={16} />
            </button>
          </>
        )}
        {state === 'paused' && (
          <>
            <button
              onClick={resume}
              className="flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold px-6 py-3 rounded-xl transition"
            >
              <Play size={18} />
              Resume
            </button>
            <button
              onClick={handleStop}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-400 px-4 py-3 rounded-xl transition"
            >
              <Square size={16} />
            </button>
          </>
        )}
        {isDone && (
          <button
            onClick={reset}
            className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-slate-900 font-semibold px-8 py-3 rounded-xl transition"
          >
            <RotateCcw size={18} />
            New session
          </button>
        )}
      </div>

      {isDone && (
        <p className="text-green-400 text-sm font-medium">
          {task ? `${task} complete!` : 'Session complete!'} Take a break.
        </p>
      )}
    </div>
  )
}
