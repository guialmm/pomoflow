import json

import pytest

from pomoflow.config import DEFAULTS, load_config, save_config


@pytest.fixture(autouse=True)
def isolated_config(tmp_path, monkeypatch):
    monkeypatch.setattr("pomoflow.config._CONFIG_FILE", tmp_path / "config.json")


def test_load_config_returns_defaults_when_missing():
    assert load_config() == DEFAULTS


def test_save_and_reload(tmp_path, monkeypatch):
    cfg_file = tmp_path / "config.json"
    monkeypatch.setattr("pomoflow.config._CONFIG_FILE", cfg_file)
    save_config(
        {
            "pomodoro_minutes": 30,
            "short_break_minutes": 10,
            "long_break_minutes": 20,
        }
    )
    result = load_config()
    assert result["pomodoro_minutes"] == 30
    assert result["short_break_minutes"] == 10
    assert result["long_break_minutes"] == 20


def test_load_config_merges_missing_keys(tmp_path, monkeypatch):
    cfg_file = tmp_path / "config.json"
    cfg_file.write_text(json.dumps({"pomodoro_minutes": 50}), encoding="utf-8")
    monkeypatch.setattr("pomoflow.config._CONFIG_FILE", cfg_file)
    result = load_config()
    assert result["pomodoro_minutes"] == 50
    assert result["short_break_minutes"] == DEFAULTS["short_break_minutes"]


def test_load_config_ignores_corrupt_file(tmp_path, monkeypatch):
    cfg_file = tmp_path / "config.json"
    cfg_file.write_text("not json", encoding="utf-8")
    monkeypatch.setattr("pomoflow.config._CONFIG_FILE", cfg_file)
    assert load_config() == DEFAULTS


def test_save_config_creates_parent_dir(tmp_path, monkeypatch):
    cfg_file = tmp_path / "nested" / "config.json"
    monkeypatch.setattr("pomoflow.config._CONFIG_FILE", cfg_file)
    save_config(dict(DEFAULTS))
    assert cfg_file.exists()
