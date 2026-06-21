from typer.testing import CliRunner

from pomoflow.main import app
from pomoflow import __version__

runner = CliRunner()


def test_version():
    result = runner.invoke(app, ["--version"])
    assert result.exit_code == 0
    assert __version__ in result.output


def test_start_default():
    result = runner.invoke(app, ["start"])
    assert result.exit_code == 0
    assert "25-minute" in result.output


def test_start_with_task():
    result = runner.invoke(app, ["start", "--task", "Write tests"])
    assert result.exit_code == 0
    assert "Write tests" in result.output


def test_start_custom_duration():
    result = runner.invoke(app, ["start", "--minutes", "45"])
    assert result.exit_code == 0
    assert "45-minute" in result.output
