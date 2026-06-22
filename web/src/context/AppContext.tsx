import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { loadConfig, saveConfig } from '../lib/storage'
import type { Theme, Locale } from '../lib/storage'
import { translations } from '../lib/i18n'
import type { T } from '../lib/i18n'

interface AppContextValue {
  locale: Locale
  theme: Theme
  focusMode: boolean
  t: T
  setLocale: (l: Locale) => void
  setTheme: (th: Theme) => void
  toggleFocusMode: () => void
  exitFocusMode: () => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function useAppContext() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppContext must be used within AppProvider')
  return ctx
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => loadConfig().locale ?? 'en')
  const [theme, setThemeState] = useState<Theme>(() => loadConfig().theme ?? 'dark')
  const [focusMode, setFocusMode] = useState(false)

  const t = translations[locale]

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const setLocale = (l: Locale) => {
    setLocaleState(l)
    saveConfig({ ...loadConfig(), locale: l })
  }

  const setTheme = (th: Theme) => {
    setThemeState(th)
    saveConfig({ ...loadConfig(), theme: th })
  }

  const toggleFocusMode = () => setFocusMode(f => !f)
  const exitFocusMode = () => setFocusMode(false)

  return (
    <AppContext.Provider value={{ locale, theme, focusMode, t, setLocale, setTheme, toggleFocusMode, exitFocusMode }}>
      {children}
    </AppContext.Provider>
  )
}
