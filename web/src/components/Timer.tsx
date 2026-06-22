import { useState, useEffect } from 'react'
import { Play, Pause, Square, SkipForward, PictureInPicture2, Coffee, BookOpen, Moon, Maximize2, Minimize2, Keyboard } from 'lucide-react'
import { useTimerContext } from '../context/TimerContext'
import { useAppContext } from '../context/AppContext'
import { loadConfig } from '../lib/storage'
import type { TimerMode } from '../context/TimerContext'
import ConfirmDialog from './ConfirmDialog'

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
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

  const { t, theme, focusMode, toggleFocusMode, exitFocusMode } = useAppContext()
  const [showConfirm, setShowConfirm] = useState(false)

  const cfg = loadConfig()
  const pomodorosUntilLong = cfg.pomodoros_until_long_break
  const pct = total > 0 ? elapsed / total : 0
  const radius = 88
  const circ = 2 * Math.PI * radius
  const dashOffset = circ * (1 - pct)
  const color = MODE_COLORS[mode]
  const isActive = phase === 'running' || phase === 'paused'
  const isDone = phase === 'done'
  const isBreak = mode !== 'pomodoro'
  const dotsFilled = sessionCount % pomodorosUntilLong
  const nextBreakIsLong = !isBreak && isDone && sessionCount % pomodorosUntilLong === 0
  const ringBg = theme === 'light' ? '#cbd5e1' : '#1e293b'

  const MODE_LABELS: Record<TimerMode, string> = {
    'pomodoro': t.mode_pomodoro,
    'short-break': t.mode_short_break,
    'long-break': t.mode_long_break,
  }

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space') {
        e.preventDefault()
        if (phase === 'idle') start()
        else if (phase === 'running') pause()
        else if (phase === 'paused') resume()
      }
      if (e.code === 'Escape') {
        if (focusMode) { exitFocusMode(); return }
        if (phase === 'running' || phase === 'paused') setShowConfirm(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, focusMode])

  const handleStop = () => setShowConfirm(true)
  const confirmStop = () => { stop(); setShowConfirm(false) }

  // Focus (fullscreen) mode layout
  if (focusMode) {
    return (
      <>
        <div className="fixed inset-0 z-40 bg-slate-900 flex flex-col items-center justify-center gap-6">
          <span className="text-sm font-medium" style={{ color }}>{MODE_LABELS[mode]}</span>

          <div className="relative flex items-center justify-center">
            <svg width="260" height="260" className="-rotate-90">
              <circle cx="130" cy="130" r="110" fill="none" stroke={ringBg} strokeWidth="10" />
              <circle
                cx="130" cy="130" r="110" fill="none"
                stroke={isDone ? '#22c55e' : color}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 110}
                strokeDashoffset={(2 * Math.PI * 110) * (1 - pct)}
                style={{ transition: 'stroke-dashoffset 0.5s linear, stroke 0.3s' }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-6xl font-mono font-semibold text-slate-100 tabular-nums">{fmt(remaining)}</span>
              {task && <span className="text-slate-400 text-sm mt-2 max-w-xs text-center truncate">{task}</span>}
            </div>
          </div>

          <div className="flex gap-3">
            {phase === 'idle' && (
              <button onClick={start} className="flex items-center gap-2 text-slate-900 font-semibold px-8 py-3 rounded-xl" style={{ backgroundColor: color }}>
                <Play size={18} />{t.btn_start}
              </button>
            )}
            {phase === 'running' && (
              <>
                <button onClick={pause} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold px-6 py-3 rounded-xl transition">
                  <Pause size={18} />{t.btn_pause}
                </button>
                <button onClick={handleStop} className="bg-slate-800 hover:bg-slate-700 text-slate-400 px-4 py-3 rounded-xl transition">
                  <Square size={16} />
                </button>
              </>
            )}
            {phase === 'paused' && (
              <>
                <button onClick={resume} className="flex items-center gap-2 text-slate-900 font-semibold px-6 py-3 rounded-xl" style={{ backgroundColor: color }}>
                  <Play size={18} />{t.btn_resume}
                </button>
                <button onClick={handleStop} className="bg-slate-800 hover:bg-slate-700 text-slate-400 px-4 py-3 rounded-xl transition">
                  <Square size={16} />
                </button>
              </>
            )}
          </div>

          <button onClick={exitFocusMode} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-xs transition px-3 py-1.5 rounded-lg hover:bg-slate-800">
            <Minimize2 size={14} />{t.btn_exit_fullscreen}
          </button>
        </div>

        {showConfirm && (
          <ConfirmDialog
            title={t.confirm_stop_title}
            body={t.confirm_stop_body}
            confirmLabel={t.btn_confirm_stop}
            cancelLabel={t.btn_cancel}
            onConfirm={confirmStop}
            onCancel={() => setShowConfirm(false)}
          />
        )}
      </>
    )
  }

  return (
    <>
      <div className="flex flex-col items-center gap-6 py-8 px-4">
        {/* top row: pip + fullscreen */}
        <div className="self-stretch flex items-center justify-between">
          <div />
          <div className="flex items-center gap-1">
            {pipSupported && isActive && (
              <button
                onClick={togglePiP}
                title="Pop out timer"
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-xs transition px-2 py-1 rounded-lg hover:bg-slate-800"
              >
                <PictureInPicture2 size={14} />{t.btn_pop_out}
              </button>
            )}
            <button
              onClick={toggleFocusMode}
              title={t.btn_fullscreen}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-xs transition px-2 py-1 rounded-lg hover:bg-slate-800"
            >
              <Maximize2 size={14} />{t.btn_fullscreen}
            </button>
          </div>
        </div>

        {/* session dots */}
        <div className="flex items-center gap-1.5" title={t.dots_tooltip(dotsFilled, pomodorosUntilLong)}>
          {Array.from({ length: pomodorosUntilLong }).map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${i < dotsFilled ? 'bg-cyan-400' : 'bg-slate-700'}`}
            />
          ))}
          <span className="text-slate-500 text-xs ml-1">{t.sessions_count(sessionCount)}</span>
        </div>

        {/* mode label */}
        <span className="text-sm font-medium" style={{ color }}>{MODE_LABELS[mode]}</span>

        {/* task input — read-only when active */}
        {!isBreak && (
          isActive || isDone ? (
            <div className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-center min-h-[48px] flex items-center justify-center">
              {task
                ? <span className="text-slate-200 truncate">{task}</span>
                : <span className="text-slate-500 italic">{t.task_placeholder}</span>
              }
            </div>
          ) : (
            <input
              type="text"
              placeholder={t.task_placeholder}
              value={task}
              onChange={e => setTask(e.target.value)}
              className="w-full max-w-sm bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-200 placeholder-slate-500 text-center focus:outline-none focus:border-cyan-500 transition"
            />
          )
        )}

        {/* ring */}
        <div className="relative flex items-center justify-center">
          <svg width="220" height="220" className="-rotate-90">
            <circle cx="110" cy="110" r={radius} fill="none" stroke={ringBg} strokeWidth="10" />
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
            <span className="text-5xl font-mono font-semibold text-slate-100 tabular-nums">{fmt(remaining)}</span>
            <span className="text-sm text-slate-400 mt-1">
              {isDone ? t.phase_done : phase === 'idle' ? `${Math.floor(total / 60)} min` : phase === 'running' ? t.phase_running : t.phase_paused}
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
              {isBreak ? t.btn_start_break : t.btn_start}
            </button>
          )}

          {phase === 'running' && (
            <>
              <button onClick={pause} className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold px-6 py-3 rounded-xl transition">
                <Pause size={18} />{t.btn_pause}
              </button>
              <button onClick={handleStop} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-400 px-4 py-3 rounded-xl transition">
                <Square size={16} />
              </button>
            </>
          )}

          {phase === 'paused' && (
            <>
              <button onClick={resume} className="flex items-center gap-2 text-slate-900 font-semibold px-6 py-3 rounded-xl transition" style={{ backgroundColor: color }}>
                <Play size={18} />{t.btn_resume}
              </button>
              <button onClick={handleStop} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-400 px-4 py-3 rounded-xl transition">
                <Square size={16} />
              </button>
            </>
          )}

          {isDone && !isBreak && (
            <button
              onClick={startBreak}
              className="flex items-center gap-2 text-slate-900 font-semibold px-7 py-3 rounded-xl transition"
              style={{ backgroundColor: nextBreakIsLong ? '#a78bfa' : '#22c55e' }}
            >
              {nextBreakIsLong ? <Moon size={18} /> : <Coffee size={18} />}
              {nextBreakIsLong ? t.btn_start_long_break : t.btn_start_break}
            </button>
          )}

          {isDone && isBreak && (
            <button
              onClick={returnToStudy}
              className="flex items-center gap-2 text-slate-900 font-semibold px-7 py-3 rounded-xl transition"
              style={{ backgroundColor: '#06b6d4' }}
            >
              <BookOpen size={18} />{t.btn_back_to_studying}
            </button>
          )}
        </div>

        {/* skip break */}
        {isBreak && phase === 'idle' && (
          <button onClick={skipBreak} className="text-slate-500 hover:text-slate-300 text-sm transition flex items-center gap-1">
            <SkipForward size={14} />{t.btn_skip_break}
          </button>
        )}

        {/* keyboard hint */}
        {phase === 'idle' && (
          <p className="text-slate-600 text-xs flex items-center gap-1">
            <Keyboard size={12} />{t.hint_space}
          </p>
        )}
      </div>

      {showConfirm && (
        <ConfirmDialog
          title={t.confirm_stop_title}
          body={t.confirm_stop_body}
          confirmLabel={t.btn_confirm_stop}
          cancelLabel={t.btn_cancel}
          onConfirm={confirmStop}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  )
}
