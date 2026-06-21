import { useState } from 'react'
import { loadConfig, saveConfig, DEFAULT_CONFIG } from '../lib/storage'
import type { Config } from '../lib/storage'

interface FieldProps {
  label: string
  value: number
  onChange: (v: number) => void
}

function Field({ label, value, onChange }: FieldProps) {
  return (
    <div className="flex items-center justify-between bg-slate-800 rounded-xl px-4 py-3">
      <span className="text-slate-300 text-sm">{label}</span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange(Math.max(1, value - 5))}
          className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center justify-center font-semibold transition"
        >−</button>
        <span className="text-slate-100 font-mono w-10 text-center tabular-nums">{value}m</span>
        <button
          onClick={() => onChange(Math.min(120, value + 5))}
          className="w-8 h-8 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 flex items-center justify-center font-semibold transition"
        >+</button>
      </div>
    </div>
  )
}

export default function Settings() {
  const [config, setConfig] = useState<Config>(loadConfig)
  const [saved, setSaved] = useState(false)

  const update = (key: keyof Config, value: number) => {
    setConfig(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  const handleSave = () => {
    saveConfig(config)
    setSaved(true)
  }

  const handleReset = () => {
    setConfig({ ...DEFAULT_CONFIG })
    saveConfig({ ...DEFAULT_CONFIG })
    setSaved(true)
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-6">
      <h2 className="text-slate-400 text-sm font-medium uppercase tracking-wider">
        Timer durations
      </h2>
      <Field label="Pomodoro" value={config.pomodoro_minutes} onChange={v => update('pomodoro_minutes', v)} />
      <Field label="Short break" value={config.short_break_minutes} onChange={v => update('short_break_minutes', v)} />
      <Field label="Long break" value={config.long_break_minutes} onChange={v => update('long_break_minutes', v)} />

      <div className="flex gap-3 mt-2">
        <button
          onClick={handleSave}
          className="flex-1 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-semibold py-3 rounded-xl transition"
        >
          {saved ? 'Saved!' : 'Save'}
        </button>
        <button
          onClick={handleReset}
          className="bg-slate-800 hover:bg-slate-700 text-slate-400 px-4 py-3 rounded-xl transition text-sm"
        >
          Reset
        </button>
      </div>
    </div>
  )
}
