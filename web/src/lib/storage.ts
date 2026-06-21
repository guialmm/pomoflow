export interface Session {
  started_at: string
  duration_minutes: number
  elapsed_seconds: number
  completed: boolean
  task: string
}

export interface Config {
  pomodoro_minutes: number
  short_break_minutes: number
  long_break_minutes: number
}

const HISTORY_KEY = 'pomoflow:history'
const CONFIG_KEY = 'pomoflow:config'

export const DEFAULT_CONFIG: Config = {
  pomodoro_minutes: 25,
  short_break_minutes: 5,
  long_break_minutes: 15,
}

export function loadHistory(): Session[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]')
  } catch {
    return []
  }
}

export function saveSession(session: Session): void {
  const history = loadHistory()
  history.push(session)
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
}

export function loadConfig(): Config {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (!raw) return { ...DEFAULT_CONFIG }
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_CONFIG }
  }
}

export function saveConfig(config: Config): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config))
}
