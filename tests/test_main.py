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
    with (
        patch("pomoflow.main.run_live_timer", return_value=(True, 1500)),
        patch("pomoflow.main.record_session"),
    ):
        result = runner.invoke(app, ["start"])
    assert result.exit_code == 0


def test_start_interrupted():
    with (
        patch("pomoflow.main.run_live_timer", return_value=(False, 300)),
        patch("pomoflow.main.record_session"),
    ):
        result = runner.invoke(app, ["start"])
    assert result.exit_code == 1


def test_start_uses_config_default():
    with (
        patch("pomoflow.main.load_config", return_value={"pomodoro_minutes": 30}),
        patch("pomoflow.main.run_live_timer", return_value=(True, 1800)) as mock,
        patch("pomoflow.main.record_session"),
    ):
        runner.invoke(app, ["start"])
    mock.assert_called_once_with(30, "")


def test_start_with_task():
    with (
        patch("pomoflow.main.run_live_timer", return_value=(True, 1500)) as mock,
        patch("pomoflow.main.record_session"),
        patch("pomoflow.main.load_config", return_value={"pomodoro_minutes": 25}),
    ):
        runner.invoke(app, ["start", "--task", "Write docs"])
    mock.assert_called_once_with(25, "Write docs")


def test_start_custom_duration():
    with (
        patch("pomoflow.main.run_live_timer", return_value=(True, 2700)) as mock,
        patch("pomoflow.main.record_session"),
    ):
        runner.invoke(app, ["start", "--minutes", "45"])
    mock.assert_called_once_with(45, "")


def test_start_records_session():
    with (
        patch("pomoflow.main.run_live_timer", return_value=(True, 1500)),
        patch("pomoflow.main.record_session") as mock_record,
    ):
        runner.invoke(app, ["start", "--minutes", "25", "--task", "Deep work"])
    mock_record.assert_called_once_with(25, 1500, True, "Deep work")


def test_history_empty(tmp_path, monkeypatch):
    monkeypatch.setattr("pomoflow.history._HISTORY_FILE", tmp_path / "history.json")
    result = runner.invoke(app, ["history"])
    assert result.exit_code == 0
    assert "No sessions" in result.output


def test_history_shows_entries(tmp_path, monkeypatch):
    import json

    history_file = tmp_path / "history.json"
    history_file.write_text(
        json.dumps(
            [
                {
                    "started_at": "2026-06-21T10:00:00",
                    "duration_minutes": 25,
                    "elapsed_seconds": 1500,
                    "completed": True,
                    "task": "Review PR",
                }
            ]
        ),
        encoding="utf-8",
    )
    monkeypatch.setattr("pomoflow.history._HISTORY_FILE", history_file)
    result = runner.invoke(app, ["history"])
    assert result.exit_code == 0
    assert "Review PR" in result.output
    assert "done" in result.output


def test_config_shows_current(tmp_path, monkeypatch):
    monkeypatch.setattr("pomoflow.config._CONFIG_FILE", tmp_path / "config.json")
    result = runner.invoke(app, ["config"])
    assert result.exit_code == 0
    assert "25" in result.output


def test_config_saves_value(tmp_path, monkeypatch):
    monkeypatch.setattr("pomoflow.config._CONFIG_FILE", tmp_path / "config.json")
    result = runner.invoke(app, ["config", "--pomodoro", "50"])
    assert result.exit_code == 0
    assert "50" in result.output


def test_config_reset(tmp_path, monkeypatch):
    cfg_file = tmp_path / "config.json"
    monkeypatch.setattr("pomoflow.config._CONFIG_FILE", cfg_file)
    runner.invoke(app, ["config", "--pomodoro", "99"])
    result = runner.invoke(app, ["config", "--reset"])
    assert result.exit_code == 0
    assert "reset" in result.output.lower()
