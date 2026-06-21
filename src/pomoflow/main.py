import typer
from rich.console import Console
from rich.table import Table

from pomoflow import __version__
from pomoflow.display import print_summary, run_live_timer
from pomoflow.history import load_history, record_session

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
    minutes: int = typer.Option(25, "--minutes", "-m", help="Duration in minutes."),
    task: str = typer.Option("", "--task", "-t", help="Label for this session."),
) -> None:
    """Start a Pomodoro session."""
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
