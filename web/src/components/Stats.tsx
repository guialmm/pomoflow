import { loadHistory } from '../lib/storage'
import { useAppContext } from '../context/AppContext'

function computeStats(days: number) {
  const history = loadHistory()
  const now = new Date()
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() - (days - 1))
  cutoff.setHours(0, 0, 0, 0)

  const recent = history.filter(s => new Date(s.started_at) >= cutoff)
  const total = recent.length
  const completed = recent.filter(s => s.completed).length
  const focusSeconds = recent.reduce((acc, s) => acc + s.elapsed_seconds, 0)

  const completedDates = new Set(
    history.filter(s => s.completed).map(s => s.started_at.slice(0, 10))
  )
  let streak = 0
  const cur = new Date()
  while (true) {
    const key = cur.toISOString().slice(0, 10)
    if (!completedDates.has(key)) break
    streak++
    cur.setDate(cur.getDate() - 1)
  }

  const byDay: Record<string, { sessions: number; seconds: number }> = {}
  for (const s of recent) {
    const day = s.started_at.slice(0, 10)
    if (!byDay[day]) byDay[day] = { sessions: 0, seconds: 0 }
    byDay[day].sessions++
    byDay[day].seconds += s.elapsed_seconds
  }

  return { total, completed, focusSeconds, streak, byDay }
}

export default function Stats() {
  const { t } = useAppContext()
  const stats = computeStats(7)

  if (stats.total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <p className="text-lg">{t.stats_empty}</p>
        <p className="text-sm mt-1">{t.stats_empty_sub}</p>
      </div>
    )
  }

  const focusMin = Math.floor(stats.focusSeconds / 60)

  return (
    <div className="flex flex-col gap-6 px-4 py-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Sessions</p>
          <p className="text-2xl font-semibold text-slate-100">
            {stats.completed}
            <span className="text-slate-500 text-base font-normal">/{stats.total}</span>
          </p>
          <p className="text-slate-500 text-xs mt-0.5">{t.stats_completed}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4">
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Focus</p>
          <p className="text-2xl font-semibold text-slate-100">{focusMin}<span className="text-slate-500 text-base font-normal">m</span></p>
          <p className="text-slate-500 text-xs mt-0.5">{t.stats_total_this_week}</p>
        </div>
        <div className="bg-slate-800 rounded-xl p-4 col-span-2">
          <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Streak</p>
          <p className="text-2xl font-semibold text-cyan-400">
            {stats.streak}
            <span className="text-slate-500 text-base font-normal ml-1">{t.stats_days(stats.streak)}</span>
          </p>
        </div>
      </div>

      <div>
        <h2 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">{t.stats_last_7}</h2>
        <div className="flex flex-col gap-2">
          {Object.entries(stats.byDay).sort((a, b) => b[0].localeCompare(a[0])).map(([day, data]) => (
            <div key={day} className="flex items-center justify-between bg-slate-800 rounded-xl px-4 py-3">
              <span className="text-slate-300 text-sm">{new Date(day + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
              <div className="flex gap-4 text-sm tabular-nums">
                <span className="text-slate-400">{data.sessions} {t.stats_sessions}</span>
                <span className="text-slate-500">{Math.floor(data.seconds / 60)}m</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
