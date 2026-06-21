import { useState, useEffect, useRef, useCallback } from 'react'

type TimerState = 'idle' | 'running' | 'paused' | 'done'

interface UseTimerResult {
  state: TimerState
  elapsed: number
  remaining: number
  start: () => void
  pause: () => void
  resume: () => void
  reset: () => void
}

export function useTimer(durationMinutes: number): UseTimerResult {
  const total = durationMinutes * 60
  const [state, setState] = useState<TimerState>('idle')
  const [elapsed, setElapsed] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearTick = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const tick = useCallback(() => {
    setElapsed(prev => {
      const next = prev + 1
      if (next >= total) {
        clearTick()
        setState('done')
        return total
      }
      return next
    })
  }, [total])

  useEffect(() => {
    if (state === 'running') {
      intervalRef.current = setInterval(tick, 1000)
    }
    return clearTick
  }, [state, tick])

  // reset when duration changes
  useEffect(() => {
    setState('idle')
    setElapsed(0)
  }, [durationMinutes])

  const start = () => {
    setElapsed(0)
    setState('running')
  }

  const pause = () => {
    clearTick()
    setState('paused')
  }

  const resume = () => setState('running')

  const reset = () => {
    clearTick()
    setElapsed(0)
    setState('idle')
  }

  return { state, elapsed, remaining: Math.max(total - elapsed, 0), start, pause, resume, reset }
}
