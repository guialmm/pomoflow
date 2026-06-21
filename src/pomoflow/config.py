import json
from pathlib import Path

_CONFIG_FILE = Path.home() / ".pomoflow" / "config.json"

DEFAULTS: dict[str, int] = {
    "pomodoro_minutes": 25,
    "short_break_minutes": 5,
    "long_break_minutes": 15,
}


def load_config() -> dict[str, int]:
    """Return config merged with defaults. Unknown keys are ignored."""
    if not _CONFIG_FILE.exists():
        return dict(DEFAULTS)
    try:
        data = json.loads(_CONFIG_FILE.read_text(encoding="utf-8"))
        return {key: int(data.get(key, default)) for key, default in DEFAULTS.items()}
    except (json.JSONDecodeError, OSError, ValueError):
        return dict(DEFAULTS)


def save_config(config: dict[str, int]) -> None:
    """Persist config to disk, creating the directory if needed."""
    _CONFIG_FILE.parent.mkdir(parents=True, exist_ok=True)
    _CONFIG_FILE.write_text(
        json.dumps(config, indent=2),
        encoding="utf-8",
    )
