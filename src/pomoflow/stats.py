from collections import defaultdict
from datetime import date, timedelta

from pomoflow.history import load_history


def _date_of(entry: dict) -> date:
    return date.fromisoformat(entry["started_at"][:10])


def compute_stats(days: int = 7) -> dict:
    """Return aggregated stats for the last `days` calendar days."""
    records = load_history()
    cutoff = date.today() - timedelta(days=days - 1)

    total_sessions = 0
    completed_sessions = 0
    total_focus_seconds = 0
    by_day: dict[date, dict] = defaultdict(lambda: {"sessions": 0, "seconds": 0})

    for entry in records:
        entry_date = _date_of(entry)
        if entry_date < cutoff:
            continue

        total_sessions += 1
        total_focus_seconds += entry["elapsed_seconds"]
        by_day[entry_date]["sessions"] += 1
        by_day[entry_date]["seconds"] += entry["elapsed_seconds"]

        if entry["completed"]:
            completed_sessions += 1

    streak = _compute_streak(records)

    return {
        "days": days,
        "total_sessions": total_sessions,
        "completed_sessions": completed_sessions,
        "total_focus_seconds": total_focus_seconds,
        "streak_days": streak,
        "by_day": dict(by_day),
    }


def _compute_streak(records: list[dict]) -> int:
    """Count consecutive days with at least one completed session, ending today."""
    completed_dates = {_date_of(e) for e in records if e.get("completed")}
    streak = 0
    current = date.today()
    while current in completed_dates:
        streak += 1
        current -= timedelta(days=1)
    return streak
