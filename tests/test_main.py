from unittest.mock import patch

from typer.testing import CliRunner

from pomoflow import __version__
from pomoflow.main import app

runner = CliRunner()


def test_version():
    result = runner.invoke(app, ["--version"])
    assert result.exit_code == 0
    assert __version__ in result.output


def test_start_completes():
    with patch("pomoflow.main.run_live_timer", return_value=(True, 1500)):
        result = runner.invoke(app, ["start"])
    assert result.exit_code == 0


def test_start_interrupted():
    with patch("pomoflow.main.run_live_timer", return_value=(False, 300)):
        result = runner.invoke(app, ["start"])
    assert result.exit_code == 1


def test_start_with_task():
    with patch("pomoflow.main.run_live_timer", return_value=(True, 1500)) as mock:
        runner.invoke(app, ["start", "--task", "Write docs"])
    mock.assert_called_once_with(25, "Write docs")


def test_start_custom_duration():
    with patch("pomoflow.main.run_live_timer", return_value=(True, 2700)) as mock:
        runner.invoke(app, ["start", "--minutes", "45"])
    mock.assert_called_once_with(45, "")
