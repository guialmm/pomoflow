import { useState } from 'react'
import { Volume2 } from 'lucide-react'
import { loadConfig, saveConfig, DEFAULT_CONFIG } from '../lib/storage'
import type { Config, AlarmSound } from '../lib/storage'
import { useAppContext } from '../context/AppContext'
import { previewSound } from '../lib/sound'

interface DurationFieldProps {
  label: string
  value: number
  onChange: (v: number) => void
  min?: number
  max?: number
}

function DurationField({ label, value, onChange, min = 1, max = 60 }: DurationFieldProps) {
  const [editing, setEditing] = useState(false)
  const [raw, setRaw] = useState('')

  const commit = (s: string) => {
    const n = parseInt(s, 10)
    if (!isNaN(n)) onChange(Math.min(max, Math.max(min, n)))
    setEditing(false)
  }

  return (
    <div className="flex items-center justify-between bg-slate-800 rounded-xl px-4 py-3">
      <span className="text-slate-300 text-sm">{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(min, value - 5))}
          className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center justify-center font-semibold transition"
        >−</button>
        {editing ? (
          <input
            type="number"
            className="w-14 text-center bg-slate-700 text-slate-100 font-mono rounded-lg px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            value={raw}
            min={min}
            max={max}
            autoFocus
            onChange={e => setRaw(e.target.value)}
            onBlur={() => commit(raw)}
            onKeyDown={e => { if (e.key === 'Enter') commit(raw); if (e.key === 'Escape') setEditing(false) }}
          />
        ) : (
          <button
            onClick={() => { setRaw(String(value)); setEditing(true) }}
            className="text-slate-100 font-mono w-14 text-center tabular-nums hover:text-cyan-400 transition"
            title="Click to edit"
          >
            {value}m
          </button>
        )}
        <button
          onClick={() => onChange(Math.min(max, value + 5))}
          className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center justify-center font-semibold transition"
        >+</button>
      </div>
    </div>
  )
}

interface ToggleProps {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}

function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <div className="flex items-center justify-between bg-slate-800 rounded-xl px-4 py-3">
      <span className="text-slate-300 text-sm">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`w-11 h-6 rounded-full transition-colors relative ${checked ? 'bg-cyan-500' : 'bg-slate-600'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  )
}

export default function Settings() {
  const { t, theme, locale, setTheme, setLocale } = useAppContext()
  const [config, setConfig] = useState<Config>(loadConfig)
  const [saved, setSaved] = useState(false)

  const update = <K extends keyof Config>(key: K, value: Config[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handleSave = () => {
    saveConfig(config)
    setSaved(true)
  }

  const handleReset = () => {
    const next = { ...DEFAULT_CONFIG, theme: config.theme, locale: config.locale }
    setConfig(next)
    saveConfig(next)
    setSaved(true)
  }

  const sounds: { value: AlarmSound; label: string }[] = [
    { value: 'tones', label: t.sound_tones },
    { value: 'bell', label: t.sound_bell },
    { value: 'beep', label: t.sound_beep },
    { value: 'tick', label: t.sound_tick },
  ]

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mt-2">{children}</h2>
  )

  return (
    <div className="flex flex-col gap-3 px-4 py-6">

      <SectionLabel>{t.settings_timer_durations}</SectionLabel>
      <DurationField label={t.settings_pomodoro} value={config.pomodoro_minutes} onChange={v => update('pomodoro_minutes', v)} />
      <DurationField label={t.settings_short_break} value={config.short_break_minutes} onChange={v => update('short_break_minutes', v)} />
      <DurationField label={t.settings_long_break} value={config.long_break_minutes} onChange={v => update('long_break_minutes', v)} />

      {/* pomodoros until long break */}
      <div className="flex items-center justify-between bg-slate-800 rounded-xl px-4 py-3">
        <span className="text-slate-300 text-sm">{t.settings_pomodoros_until_long}</span>
        <div className="flex items-center gap-3">
          <button onClick={() => update('pomodoros_until_long_break', Math.max(1, config.pomodoros_until_long_break - 1))}
            className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center justify-center font-semibold transition">−</button>
          <span className="text-slate-100 font-mono w-6 text-center tabular-nums">{config.pomodoros_until_long_break}</span>
          <button onClick={() => update('pomodoros_until_long_break', Math.min(8, config.pomodoros_until_long_break + 1))}
            className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center justify-center font-semibold transition">+</button>
        </div>
      </div>

      <SectionLabel>{t.settings_behavior}</SectionLabel>
      <Toggle label={t.settings_auto_start_breaks} checked={config.auto_start_breaks} onChange={v => update('auto_start_breaks', v)} />
      <Toggle label={t.settings_auto_start_pomodoros} checked={config.auto_start_pomodoros} onChange={v => update('auto_start_pomodoros', v)} />

      <SectionLabel>{t.settings_sound_section}</SectionLabel>
      {/* sound selector */}
      <div className="bg-slate-800 rounded-xl px-4 py-3 flex flex-col gap-3">
        <span className="text-slate-300 text-sm">{t.settings_alarm_sound}</span>
        <div className="grid grid-cols-2 gap-2">
          {sounds.map(s => (
            <button
              key={s.value}
              onClick={() => { update('alarm_sound', s.value); previewSound(s.value, config.alarm_volume) }}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition ${config.alarm_sound === s.value ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
            >
              {s.label}
              <Volume2 size={12} className="opacity-50" />
            </button>
          ))}
        </div>
      </div>
      {/* volume slider */}
      <div className="bg-slate-800 rounded-xl px-4 py-3 flex items-center gap-3">
        <span className="text-slate-300 text-sm shrink-0">{t.settings_volume}</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={config.alarm_volume}
          onChange={e => update('alarm_volume', parseFloat(e.target.value))}
          className="flex-1 accent-cyan-500"
        />
        <span className="text-slate-400 text-xs tabular-nums w-8 text-right">{Math.round(config.alarm_volume * 100)}%</span>
      </div>

      <SectionLabel>{t.settings_appearance}</SectionLabel>
      {/* theme toggle */}
      <div className="flex items-center justify-between bg-slate-800 rounded-xl px-4 py-3">
        <span className="text-slate-300 text-sm">{t.settings_theme}</span>
        <div className="flex rounded-lg overflow-hidden border border-slate-700">
          {(['dark', 'light'] as const).map(th => (
            <button
              key={th}
              onClick={() => { update('theme', th); setTheme(th) }}
              className={`px-3 py-1.5 text-xs font-medium transition ${theme === th ? 'bg-cyan-500 text-slate-900' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {th === 'dark' ? t.settings_theme_dark : t.settings_theme_light}
            </button>
          ))}
        </div>
      </div>
      {/* language toggle */}
      <div className="flex items-center justify-between bg-slate-800 rounded-xl px-4 py-3">
        <span className="text-slate-300 text-sm">{t.settings_language}</span>
        <div className="flex rounded-lg overflow-hidden border border-slate-700">
          {(['en', 'pt'] as const).map(l => (
            <button
              key={l}
              onClick={() => { update('locale', l); setLocale(l) }}
              className={`px-3 py-1.5 text-xs font-medium transition ${locale === l ? 'bg-cyan-500 text-slate-900' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {l === 'en' ? 'EN' : 'PT'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 mt-2">
        <button onClick={handleSave} className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold py-3 rounded-xl transition">
          {saved ? t.btn_saved : t.btn_save}
        </button>
        <button onClick={handleReset} className="bg-slate-800 hover:bg-slate-700 text-slate-400 px-4 py-3 rounded-xl transition text-sm">
          {t.btn_reset}
        </button>
      </div>
    </div>
  )
}
