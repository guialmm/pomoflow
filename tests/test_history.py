import pytest

from pomoflow.history import load_history, record_session


@pytest.fixture(autouse=True)
def isolated_history(tmp_path, monkeypatch):
    monkeypatch.setattr("pomoflow.history._DATA_DIR", tmp_path)
    monkeypatch.setattr("pomoflow.history._HISTORY_FILE", tmp_path / "history.json")


def test_load_history_empty():
    assert load_history() == []


def test_record_creates_file(tmp_path):
    record_session(25, 1500, True, "Write tests")
    history_file = tmp_path / "history.json"
    assert history_file.exists()


def test_record_appends_entries():
    record_session(25, 1500, True, "First")
    record_session(25, 900, False, "Second")
    records = load_history()
    assert len(records) == 2
    assert records[0]["task"] == "First"
    assert records[1]["task"] == "Second"


def test_record_session_fields():
    record_session(25, 1500, True, "Deep work")
    entry = load_history()[0]
    assert entry["duration_minutes"] == 25
    assert entry["elapsed_seconds"] == 1500
    assert entry["completed"] is True
    assert entry["task"] == "Deep work"
    assert "started_at" in entry


def test_record_without_task():
    record_session(25, 1500, True)
    entry = load_history()[0]
    assert entry["task"] == ""


def test_load_history_ignores_corrupt_file(tmp_path):
    (tmp_path / "history.json").write_text("not json", encoding="utf-8")
    assert load_history() == []
