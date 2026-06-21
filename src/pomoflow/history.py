import json
from datetime import datetime
from pathlib import Path

_DATA_DIR = Path.home() / ".pomoflow"
_HISTORY_FILE = _DATA_DIR / "history.json"


def _load() -> list[dict]:
    if not _HISTORY_FILE.exists():
        return []
    try:
        return json.loads(_HISTORY_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return []


def _save(records: list[dict]) -> None:
    _DATA_DIR.mkdir(parents=True, exist_ok=True)
    _HISTORY_FILE.write_text(
        json.dumps(records, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )


def record_session(
    duration_minutes: int,
    elapsed_seconds: int,
    completed: bool,
    task: str = "",
) -> None:
    """Append one session entry to the local history file."""
    records = _load()
    records.append(
        {
            "started_at": datetime.now().isoformat(timespec="seconds"),
            "duration_minutes": duration_minutes,
            "elapsed_seconds": elapsed_seconds,
            "completed": completed,
            "task": task,
        }
    )
    _save(records)


def load_history() -> list[dict]:
    """Return all recorded sessions, oldest first."""
    return _load()
