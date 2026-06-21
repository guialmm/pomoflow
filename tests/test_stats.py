from datetime import date, timedelta
from unittest.mock import patch

from pomoflow.stats import _compute_streak, compute_stats


def _entry(days_ago: int, completed: bool = True, elapsed: int = 1500) -> dict:
    d = (date.today() - timedelta(days=days_ago)).isoformat()
    return {
        "started_at": f"{d}T10:00:00",
        "duration_minutes": 25,
        "elapsed_seconds": elapsed,
        "completed": completed,
        "task": "",
    }


def test_compute_stats_empty():
    with patch("pomoflow.stats.load_history", return_value=[]):
        result = compute_stats(7)
    assert result["total_sessions"] == 0
    assert result["completed_sessions"] == 0
    assert result["total_focus_seconds"] == 0
    assert result["streak_days"] == 0


def test_compute_stats_counts_sessions():
    records = [_entry(0), _entry(1), _entry(1, completed=False)]
    with patch("pomoflow.stats.load_history", return_value=records):
        result = compute_stats(7)
    assert result["total_sessions"] == 3
    assert result["completed_sessions"] == 2


def test_compute_stats_total_focus_time():
    records = [_entry(0, elapsed=1500), _entry(1, elapsed=900)]
    with patch("pomoflow.stats.load_history", return_value=records):
        result = compute_stats(7)
    assert result["total_focus_seconds"] == 2400


def test_compute_stats_excludes_old_sessions():
    records = [_entry(0), _entry(10)]
    with patch("pomoflow.stats.load_history", return_value=records):
        result = compute_stats(7)
    assert result["total_sessions"] == 1


def test_compute_stats_by_day_grouping():
    records = [_entry(0), _entry(0), _entry(1)]
    with patch("pomoflow.stats.load_history", return_value=records):
        result = compute_stats(7)
    today = date.today()
    assert result["by_day"][today]["sessions"] == 2
    assert result["by_day"][today - timedelta(days=1)]["sessions"] == 1


def test_streak_no_sessions():
    assert _compute_streak([]) == 0


def test_streak_consecutive():
    records = [_entry(0), _entry(1), _entry(2)]
    assert _compute_streak(records) == 3


def test_streak_breaks_on_gap():
    records = [_entry(0), _entry(2)]
    assert _compute_streak(records) == 1


def test_streak_only_counts_completed():
    records = [_entry(0, completed=False), _entry(1)]
    assert _compute_streak(records) == 0
