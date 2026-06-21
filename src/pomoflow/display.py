from rich.console import Console
from rich.live import Live
from rich.panel import Panel
from rich.text import Text

from pomoflow.timer import run_timer

console = Console()

BAR_WIDTH = 32


def _fmt_time(seconds: int) -> str:
    m, s = divmod(seconds, 60)
    return f"{m:02d}:{s:02d}"


def _render(elapsed: int, total: int, task: str) -> Panel:
    remaining = max(total - elapsed, 0)
    pct = elapsed / total if total > 0 else 0

    filled = int(BAR_WIDTH * pct)
    bar = "█" * filled + "░" * (BAR_WIDTH - filled)

    body = Text(justify="left")
    if task:
        body.append(f" {task}\n\n", style="bold white")
    body.append(f" {bar} ", style="green")
    body.append(_fmt_time(remaining), style="bold cyan")

    return Panel(body, title="pomoflow", border_style="cyan", padding=(1, 2))


def run_live_timer(duration_minutes: int, task: str) -> tuple[bool, int]:
    """Render a live countdown and return (completed, elapsed_seconds)."""
    total = duration_minutes * 60

    with Live(
        _render(0, total, task),
        refresh_per_second=2,
        console=console,
        transient=False,
    ) as live:
        completed, elapsed = run_timer(
            duration_minutes,
            on_tick=lambda e, t: live.update(_render(e, t, task)),
        )

    return completed, elapsed


def print_summary(completed: bool, elapsed: int, task: str) -> None:
    m, s = divmod(elapsed, 60)
    elapsed_str = f"{m}m {s}s"

    if completed:
        msg = Text()
        msg.append("Session complete", style="bold green")
        if task:
            msg.append(f" — {task}", style="white")
        msg.append(f"\n  Total time: {elapsed_str}", style="dim")
        console.print(Panel(msg, border_style="green", padding=(1, 2)))
    else:
        msg = Text()
        msg.append("Session interrupted", style="bold yellow")
        msg.append(f"\n  Time elapsed: {elapsed_str}", style="dim")
        console.print(Panel(msg, border_style="yellow", padding=(1, 2)))
