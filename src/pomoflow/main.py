import typer
from rich.console import Console
from rich.table import Table

from pomoflow import __version__
from pomoflow.config import DEFAULTS, load_config, save_config
from pomoflow.display import print_summary, run_live_timer
from pomoflow.history import load_history, record_session
from pomoflow.stats import compute_stats

app = typer.Typer(
    name="pomoflow",
    help="A focused Pomodoro timer for the terminal.",
    add_completion=False,
)


def _version_callback(value: bool) -> None:
    if value:
        typer.echo(f"pomoflow {__version__}")
        raise typer.Exit()


@app.callback()
def main(
    version: bool = typer.Option(
        None,
        "--version",
        "-v",
        callback=_version_callback,
        is_eager=True,
        help="Show version and exit.",
    ),
) -> None:
    pass


@app.command()
def start(
    minutes: int = typer.Option(None, "--minutes", "-m", help="Duration in minutes."),
    task: str = typer.Option("", "--task", "-t", help="Label for this session."),
) -> None:
    """Start a Pomodoro session."""
    if minutes is None:
        minutes = load_config()["pomodoro_minutes"]
    completed, elapsed = run_live_timer(minutes, task)
    record_session(minutes, elapsed, completed, task)
    print_summary(completed, elapsed, task)
    raise typer.Exit(code=0 if completed else 1)


@app.command()
def history(
    limit: int = typer.Option(10, "--limit", "-n", help="Number of sessions to show."),
) -> None:
    """Show recent Pomodoro sessions."""
    console = Console()
    records = load_history()

    if not records:
        console.print("[dim]No sessions recorded yet.[/dim]")
        return

    recent = records[-limit:][::-1]

    table = Table(title="Session History", border_style="cyan", show_lines=False)
    table.add_column("Date", style="dim", no_wrap=True)
    table.add_column("Task", style="white")
    table.add_column("Duration", justify="right")
    table.add_column("Status", justify="center")

    for entry in recent:
        date = entry["started_at"][:16].replace("T", " ")
        task_label = entry.get("task") or "-"
        elapsed = entry["elapsed_seconds"]
        m, s = divmod(elapsed, 60)
        duration = f"{m}m {s:02d}s"
        if entry["completed"]:
            status = "[green]done[/green]"
        else:
            status = "[yellow]interrupted[/yellow]"
        table.add_row(date, task_label, duration, status)

    console.print(table)


@app.command()
def stats(
    days: int = typer.Option(7, "--days", "-d", help="Number of days to summarize."),
) -> None:
    """Show focus statistics for the last N days."""
    console = Console()
    data = compute_stats(days)

    if data["total_sessions"] == 0:
        console.print(f"[dim]No sessions in the last {days} days.[/dim]")
        return

    total_m = data["total_focus_seconds"] // 60
    completed = data["completed_sessions"]
    total = data["total_sessions"]
    streak = data["streak_days"]

    console.print()
    console.print(f"[bold cyan]Last {days} days[/bold cyan]")
    console.print(f"  Sessions : [white]{completed}/{total} completed[/white]")
    console.print(f"  Focus    : [white]{total_m}m total[/white]")
    if streak:
        label = "days" if streak != 1 else "day"
        console.print(f"  Streak   : [green]{streak} {label}[/green]")
    else:
        console.print("  Streak   : [dim]none[/dim]")

    if data["by_day"]:
        console.print()
        table = Table(border_style="cyan", show_header=True, show_lines=False)
        table.add_column("Date", style="dim", no_wrap=True)
        table.add_column("Sessions", justify="right")
        table.add_column("Focus", justify="right")

        for day in sorted(data["by_day"], reverse=True):
            entry = data["by_day"][day]
            focus_m = entry["seconds"] // 60
            table.add_row(str(day), str(entry["sessions"]), f"{focus_m}m")

        console.print(table)


_OPT_POMODORO = typer.Option(None, "--pomodoro", "-p", help="Pomodoro (min).")
_OPT_SHORT = typer.Option(None, "--short-break", "-s", help="Short break (min).")
_OPT_LONG = typer.Option(None, "--long-break", "-l", help="Long break (min).")
_OPT_RESET = typer.Option(False, "--reset", help="Reset to defaults.")


@app.command("config")
def config_cmd(
    pomodoro: int = _OPT_POMODORO,
    short_break: int = _OPT_SHORT,
    long_break: int = _OPT_LONG,
    reset: bool = _OPT_RESET,
) -> None:
    """View or update timer configuration."""
    console = Console()

    if reset:
        save_config(dict(DEFAULTS))
        console.print("[green]Config reset to defaults.[/green]")
        return

    cfg = load_config()

    if pomodoro is not None:
        cfg["pomodoro_minutes"] = pomodoro
    if short_break is not None:
        cfg["short_break_minutes"] = short_break
    if long_break is not None:
        cfg["long_break_minutes"] = long_break

    if any(v is not None for v in (pomodoro, short_break, long_break)):
        save_config(cfg)
        console.print("[green]Config saved.[/green]")

    console.print()
    console.print("[bold cyan]Current configuration[/bold cyan]")
    console.print(f"  Pomodoro    : [white]{cfg['pomodoro_minutes']} min[/white]")
    console.print(f"  Short break : [white]{cfg['short_break_minutes']} min[/white]")
    console.print(f"  Long break  : [white]{cfg['long_break_minutes']} min[/white]")
