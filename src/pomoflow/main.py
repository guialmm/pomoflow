import typer

from pomoflow import __version__

app = typer.Typer(
    name="pomoflow",
    help="A focused Pomodoro timer for the terminal.",
    add_completion=False,
)


def version_callback(value: bool) -> None:
    if value:
        typer.echo(f"pomoflow {__version__}")
        raise typer.Exit()


@app.callback()
def main(
    version: bool = typer.Option(
        None,
        "--version",
        "-v",
        callback=version_callback,
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
    label = f": {task}" if task else ""
    typer.echo(f"Starting {minutes}-minute session{label}...")
