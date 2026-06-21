import typer

from pomoflow import __version__
from pomoflow.display import print_summary, run_live_timer

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
    print_summary(completed, elapsed, task)
    raise typer.Exit(code=0 if completed else 1)
