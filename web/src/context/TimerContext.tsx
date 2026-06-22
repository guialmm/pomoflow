import { createContext, useContext, useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { loadConfig, saveSession } from '../lib/storage'
import { startAlarm, stopAlarm, primeAudio } from '../lib/sound'

export type TimerMode = 'pomodoro' | 'short-break' | 'long-break'
export type TimerPhase = 'idle' | 'running' | 'paused' | 'done'

interface TimerContextValue {
  mode: TimerMode
  phase: TimerPhase
  elapsed: number
  remaining: number
  total: number
  task: string
  sessionCount: number
  pipSupported: boolean
  setTask: (t: string) => void
  start: () => void
  pause: () => void
  resume: () => void
  stop: () => void
  skipBreak: () => void
  startBreak: () => void
  returnToStudy: () => void
  togglePiP: () => void
}

const TimerContext = createContext<TimerContextValue | null>(null)

export function useTimerContext() {
  const ctx = useContext(TimerContext)
  if (!ctx) throw new Error('useTimerContext must be used within TimerProvider')
  return ctx
}

function getTotal(mode: TimerMode): number {
  const cfg = loadConfig()
  if (mode === 'pomodoro') return cfg.pomodoro_minutes * 60
  if (mode === 'short-break') return cfg.short_break_minutes * 60
  return cfg.long_break_minutes * 60
}

function fmtTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function sendNotification(body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('pomoflow', { body })
  }
}

const MODE_COLORS: Record<TimerMode, string> = {
  'pomodoro': '#06b6d4',
  'short-break': '#22c55e',
  'long-break': '#a78bfa',
}

const MODE_LABELS: Record<TimerMode, string> = {
  'pomodoro': 'Focus',
  'short-break': 'Short break',
  'long-break': 'Long break',
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<TimerMode>('pomodoro')
  const [phase, setPhase] = useState<TimerPhase>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [task, setTask] = useState('')
  const [sessionCount, setSessionCount] = useState(0)

  const phaseRef = useRef<TimerPhase>('idle')
  const modeRef = useRef<TimerMode>('pomodoro')
  const taskRef = useRef('')
  const sessionCountRef = useRef(0)
  const startedAtRef = useRef<number | null>(null)
  const baseElapsedRef = useRef(0)
  const totalRef = useRef(getTotal('pomodoro'))
  const sessionStartRef = useRef('')
  const pipWinRef = useRef<Window | null>(null)
  const pipElRef = useRef<HTMLElement | null>(null)

  phaseRef.current = phase
  modeRef.current = mode
  taskRef.current = task
  sessionCountRef.current = sessionCount

  const pipSupported = 'documentPictureInPicture' in window

  const updatePiP = () => {
    const el = pipElRef.current
    if (!el || !pipWinRef.current || pipWinRef.current.closed) return
    const remaining = Math.max(totalRef.current - (
      phaseRef.current === 'running' && startedAtRef.current !== null
        ? baseElapsedRef.current + Math.floor((Date.now() - startedAtRef.current) / 1000)
        : baseElapsedRef.current
    ), 0)
    const color = MODE_COLORS[modeRef.current]
    const label = MODE_LABELS[modeRef.current]
    const taskText = taskRef.current || (modeRef.current === 'pomodoro' ? 'Pomodoro' : 'Break')
    const isRunning = phaseRef.current === 'running'
    el.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:6px;padding:16px;background:#0f172a;">
        <div style="font-size:11px;font-weight:600;color:${color};text-transform:uppercase;letter-spacing:0.08em;">${label}</div>
        <div style="font-size:52px;font-weight:700;color:#f1f5f9;font-variant-numeric:tabular-nums;letter-spacing:-2px;line-height:1;">${fmtTime(remaining)}</div>
        <div style="font-size:11px;color:#64748b;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${taskText}</div>
        <div style="font-size:10px;color:${isRunning ? color : '#f59e0b'};margin-top:2px;">${isRunning ? 'running' : phaseRef.current}</div>
      </div>
    `
  }

  const updateTitle = (remaining: number, mode: TimerMode, phase: TimerPhase) => {
    if (phase === 'idle') {
      document.title = 'pomoflow'
    } else {
      const label = mode === 'pomodoro' ? 'focus' : 'break'
      document.title = `${fmtTime(remaining)} [${label}] — pomoflow`
    }
  }

  // Internal: start break without primeAudio (used for auto-start)
  const _startBreak = () => {
    if (phaseRef.current !== 'done') return
    stopAlarm()
    const cfg = loadConfig()
    const n = cfg.pomodoros_until_long_break
    const nextMode = sessionCountRef.current % n === 0 ? 'long-break' : 'short-break'
    const nextTotal = getTotal(nextMode)
    modeRef.current = nextMode
    totalRef.current = nextTotal
    baseElapsedRef.current = 0
    startedAtRef.current = Date.now()
    sessionStartRef.current = new Date().toISOString()
    setMode(nextMode)
    setElapsed(0)
    setPhase('running')
    phaseRef.current = 'running'
  }

  // Internal: start pomodoro without primeAudio (used for auto-start)
  const _startPomodoro = () => {
    if (phaseRef.current !== 'done') return
    stopAlarm()
    const total = getTotal('pomodoro')
    modeRef.current = 'pomodoro'
    totalRef.current = total
    baseElapsedRef.current = 0
    startedAtRef.current = Date.now()
    sessionStartRef.current = new Date().toISOString()
    setMode('pomodoro')
    setElapsed(0)
    setPhase('running')
    phaseRef.current = 'running'
  }

  const handleComplete = () => {
    startedAtRef.current = null
    const finishedMode = modeRef.current
    const finishedTotal = totalRef.current
    setElapsed(finishedTotal)
    setPhase('done')
    phaseRef.current = 'done'

    const cfg = loadConfig()
    startAlarm(cfg.alarm_sound, cfg.alarm_volume)

    if (finishedMode === 'pomodoro') {
      saveSession({
        started_at: sessionStartRef.current,
        duration_minutes: Math.floor(finishedTotal / 60),
        elapsed_seconds: finishedTotal,
        completed: true,
        task: taskRef.current,
      })
      sendNotification(`${taskRef.current || 'Pomodoro'} complete! Time for a break.`)
      const newCount = sessionCountRef.current + 1
      sessionCountRef.current = newCount
      setSessionCount(newCount)
      if (cfg.auto_start_breaks) setTimeout(_startBreak, 1500)
    } else {
      sendNotification('Break over! Ready to focus?')
      if (cfg.auto_start_pomodoros) setTimeout(_startPomodoro, 1500)
    }

    updateTitle(0, finishedMode, 'done')
    updatePiP()
  }

  useEffect(() => {
    const id = setInterval(() => {
      if (phaseRef.current !== 'running' || startedAtRef.current === null) return
      const e = baseElapsedRef.current + Math.floor((Date.now() - startedAtRef.current) / 1000)
      if (e >= totalRef.current) {
        handleComplete()
      } else {
        const remaining = totalRef.current - e
        setElapsed(e)
        updateTitle(remaining, modeRef.current, 'running')
        updatePiP()
      }
    }, 500)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const onVisible = () => {
      if (phaseRef.current === 'running' && startedAtRef.current !== null) {
        const e = baseElapsedRef.current + Math.floor((Date.now() - startedAtRef.current) / 1000)
        if (e >= totalRef.current) handleComplete()
        else setElapsed(e)
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    if (phase === 'idle' || phase === 'done') document.title = 'pomoflow'
    else if (phase === 'paused') {
      const remaining = Math.max(totalRef.current - elapsed, 0)
      updateTitle(remaining, mode, 'paused')
    }
    updatePiP()
  }, [phase, mode])

  const togglePiP = async () => {
    if (!('documentPictureInPicture' in window)) return
    if (pipWinRef.current && !pipWinRef.current.closed) {
      pipWinRef.current.close()
      pipWinRef.current = null
      pipElRef.current = null
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pipWin: Window = await (window as any).documentPictureInPicture.requestWindow({ width: 240, height: 160 })
    pipWinRef.current = pipWin
    const style = pipWin.document.createElement('style')
    style.textContent = '* { margin:0; padding:0; box-sizing:border-box; } body { height:100vh; overflow:hidden; }'
    pipWin.document.head.appendChild(style)
    const el = pipWin.document.createElement('div')
    el.style.cssText = 'height:100%;'
    pipWin.document.body.appendChild(el)
    pipElRef.current = el
    updatePiP()
    pipWin.addEventListener('pagehide', () => { pipWinRef.current = null; pipElRef.current = null })
  }

  const start = () => {
    primeAudio()
    const total = getTotal(modeRef.current)
    totalRef.current = total
    baseElapsedRef.current = 0
    startedAtRef.current = Date.now()
    sessionStartRef.current = new Date().toISOString()
    setElapsed(0)
    setPhase('running')
    phaseRef.current = 'running'
  }

  const pause = () => {
    if (startedAtRef.current !== null) {
      baseElapsedRef.current += Math.floor((Date.now() - startedAtRef.current) / 1000)
      startedAtRef.current = null
    }
    setPhase('paused')
    phaseRef.current = 'paused'
  }

  const resume = () => {
    primeAudio()
    startedAtRef.current = Date.now()
    setPhase('running')
    phaseRef.current = 'running'
  }

  const stop = () => {
    stopAlarm()
    if (phaseRef.current === 'running' || phaseRef.current === 'paused') {
      const e = startedAtRef.current !== null
        ? baseElapsedRef.current + Math.floor((Date.now() - startedAtRef.current) / 1000)
        : baseElapsedRef.current
      if (modeRef.current === 'pomodoro') {
        saveSession({
          started_at: sessionStartRef.current,
          duration_minutes: Math.floor(totalRef.current / 60),
          elapsed_seconds: e,
          completed: false,
          task: taskRef.current,
        })
      }
    }
    startedAtRef.current = null
    baseElapsedRef.current = 0
    modeRef.current = 'pomodoro'
    totalRef.current = getTotal('pomodoro')
    setMode('pomodoro')
    setElapsed(0)
    setPhase('idle')
    phaseRef.current = 'idle'
    document.title = 'pomoflow'
    pipWinRef.current?.close()
    pipWinRef.current = null
    pipElRef.current = null
  }

  // Classic cycle: N pomodoros each with short break; Nth gets long break
  const startBreak = () => {
    stopAlarm()
    primeAudio()
    const cfg = loadConfig()
    const n = cfg.pomodoros_until_long_break
    const nextMode = sessionCountRef.current % n === 0 ? 'long-break' : 'short-break'
    const nextTotal = getTotal(nextMode)
    modeRef.current = nextMode
    totalRef.current = nextTotal
    baseElapsedRef.current = 0
    startedAtRef.current = Date.now()
    sessionStartRef.current = new Date().toISOString()
    setMode(nextMode)
    setElapsed(0)
    setPhase('running')
    phaseRef.current = 'running'
  }

  const returnToStudy = () => {
    stopAlarm()
    modeRef.current = 'pomodoro'
    totalRef.current = getTotal('pomodoro')
    setMode('pomodoro')
    setElapsed(0)
    baseElapsedRef.current = 0
    setPhase('idle')
    phaseRef.current = 'idle'
    document.title = 'pomoflow'
  }

  const skipBreak = () => {
    stopAlarm()
    startedAtRef.current = null
    baseElapsedRef.current = 0
    modeRef.current = 'pomodoro'
    totalRef.current = getTotal('pomodoro')
    setMode('pomodoro')
    setElapsed(0)
    setPhase('idle')
    phaseRef.current = 'idle'
    document.title = 'pomoflow'
  }

  const total = totalRef.current

  return (
    <TimerContext.Provider value={{
      mode, phase, elapsed, remaining: Math.max(total - elapsed, 0),
      total, task, sessionCount, pipSupported,
      setTask, start, pause, resume, stop, skipBreak, startBreak, returnToStudy, togglePiP,
    }}>
      {children}
    </TimerContext.Provider>
  )
}
