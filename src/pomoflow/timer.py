import time
from dataclasses import dataclass, field
from datetime import datetime
from typing import Callable


@dataclass
class SessionResult:
    duration_minutes: int
    task: str
    started_at: datetime
    elapsed_seconds: int
    completed: bool = False

    @property
    def elapsed_minutes(self) -> float:
        return self.elapsed_seconds / 60


def run_timer(
    duration_minutes: int,
    on_tick: Callable[[int, int], None],
) -> tuple[bool, int]:
    """Drive a countdown, calling on_tick(elapsed, total) every 0.5s.

    Returns (completed, elapsed_seconds). KeyboardInterrupt is caught
    here so callers always get a clean result.
    """
    total = duration_minutes * 60
    start = time.monotonic()

    try:
        while True:
            elapsed = int(time.monotonic() - start)
            if elapsed >= total:
                on_tick(total, total)
                return True, total
            on_tick(elapsed, total)
            time.sleep(0.5)
    except KeyboardInterrupt:
        elapsed = int(time.monotonic() - start)
        return False, elapsed


def make_session(duration_minutes: int, task: str, elapsed: int, completed: bool) -> SessionResult:
    return SessionResult(
        duration_minutes=duration_minutes,
        task=task,
        started_at=datetime.now(),
        elapsed_seconds=elapsed,
        completed=completed,
    )
