import { createContext, useContext, useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { loadConfig, saveSession } from '../lib/storage'

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
  setTask: (t: string) => void
  start: () => void
  pause: () => void
  resume: () => void
  stop: () => void
  skipBreak: () => void
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

function sendNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body })
  }
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<TimerMode>('pomodoro')
  const [phase, setPhase] = useState<TimerPhase>('idle')
  const [elapsed, setElapsed] = useState(0)
  const [task, setTask] = useState('')
  const [sessionCount, setSessionCount] = useState(0)

  // Refs so the interval never has stale closures
  const phaseRef = useRef<TimerPhase>('idle')
  const modeRef = useRef<TimerMode>('pomodoro')
  const taskRef = useRef('')
  const sessionCountRef = useRef(0)
  const startedAtRef = useRef<number | null>(null)
  const baseElapsedRef = useRef(0)
  const totalRef = useRef(getTotal('pomodoro'))
  const sessionStartRef = useRef('')

  phaseRef.current = phase
  modeRef.current = mode
  taskRef.current = task
  sessionCountRef.current = sessionCount

  const transitionToBreak = (count: number) => {
    const nextMode: TimerMode = count % 4 === 0 ? 'long-break' : 'short-break'
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

  const handleComplete = () => {
    startedAtRef.current = null
    const finishedMode = modeRef.current
    const finishedTotal = totalRef.current
    setElapsed(finishedTotal)
    setPhase('done')
    phaseRef.current = 'done'

    if (finishedMode === 'pomodoro') {
      saveSession({
        started_at: sessionStartRef.current,
        duration_minutes: Math.floor(finishedTotal / 60),
        elapsed_seconds: finishedTotal,
        completed: true,
        task: taskRef.current,
      })
      const label = taskRef.current || 'Pomodoro'
      sendNotification('pomoflow', `${label} complete! Break time.`)

      const newCount = sessionCountRef.current + 1
      sessionCountRef.current = newCount
      setSessionCount(newCount)

      setTimeout(() => transitionToBreak(newCount), 1500)
    } else {
      sendNotification('pomoflow', 'Break over! Ready for the next session?')
      setTimeout(() => {
        modeRef.current = 'pomodoro'
        totalRef.current = getTotal('pomodoro')
        setMode('pomodoro')
        setElapsed(0)
        baseElapsedRef.current = 0
        setPhase('idle')
        phaseRef.current = 'idle'
      }, 1500)
    }
  }

  // Single long-lived interval — reads from refs, no stale closures
  useEffect(() => {
    const id = setInterval(() => {
      if (phaseRef.current !== 'running' || startedAtRef.current === null) return
      const e = baseElapsedRef.current + Math.floor((Date.now() - startedAtRef.current) / 1000)
      if (e >= totalRef.current) {
        handleComplete()
      } else {
        setElapsed(e)
      }
    }, 500)
    return () => clearInterval(id)
  }, [])

  // Re-check when browser tab becomes visible again
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

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const start = () => {
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
    startedAtRef.current = Date.now()
    setPhase('running')
    phaseRef.current = 'running'
  }

  const stop = () => {
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
  }

  const skipBreak = () => {
    startedAtRef.current = null
    baseElapsedRef.current = 0
    modeRef.current = 'pomodoro'
    totalRef.current = getTotal('pomodoro')
    setMode('pomodoro')
    setElapsed(0)
    setPhase('idle')
    phaseRef.current = 'idle'
  }

  const total = totalRef.current

  return (
    <TimerContext.Provider value={{
      mode, phase, elapsed, remaining: Math.max(total - elapsed, 0),
      total, task, sessionCount,
      setTask, start, pause, resume, stop, skipBreak,
    }}>
      {children}
    </TimerContext.Provider>
  )
}
