import { loadHistory } from '../lib/storage'
import type { Session } from '../lib/storage'
import { useAppContext } from '../context/AppContext'

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${String(s).padStart(2, '0')}s`
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function History() {
  const { t } = useAppContext()
  const sessions = loadHistory().slice().reverse()

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <p className="text-lg">{t.history_empty}</p>
        <p className="text-sm mt-1">{t.history_empty_sub}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 px-4 py-6">
      <h2 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">{t.history_title}</h2>
      {sessions.map((s: Session, i: number) => (
        <div key={i} className="flex items-center justify-between bg-slate-800 rounded-xl px-4 py-3 gap-3">
          <div className="flex flex-col min-w-0">
            <span className="text-slate-200 text-sm font-medium truncate">
              {s.task || <span className="text-slate-500 italic">{t.history_untitled}</span>}
            </span>
            <span className="text-slate-500 text-xs mt-0.5">{fmtDate(s.started_at)}</span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-slate-400 text-sm tabular-nums">{fmt(s.elapsed_seconds)}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.completed ? 'bg-green-500/15 text-green-400' : 'bg-yellow-500/15 text-yellow-400'}`}>
              {s.completed ? t.history_done : t.history_interrupted}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
