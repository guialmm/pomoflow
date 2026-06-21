import platform
from unittest.mock import MagicMock, patch

import pytest

from pomoflow.notifications import notify


@pytest.fixture(autouse=True)
def no_subprocess(monkeypatch):
    monkeypatch.setattr("subprocess.run", MagicMock())


class TestMacOS:
    def test_calls_osascript(self, monkeypatch):
        monkeypatch.setattr(platform, "system", lambda: "Darwin")
        with patch("subprocess.run") as mock_run:
            notify("title", "message")
        mock_run.assert_called_once()
        cmd = mock_run.call_args[0][0]
        assert cmd[0] == "osascript"
        assert "title" in cmd[2]
        assert "message" in cmd[2]

    def test_missing_osascript_is_silent(self, monkeypatch):
        monkeypatch.setattr(platform, "system", lambda: "Darwin")
        with patch("subprocess.run", side_effect=FileNotFoundError):
            notify("title", "message")


class TestLinux:
    def test_calls_notify_send(self, monkeypatch):
        monkeypatch.setattr(platform, "system", lambda: "Linux")
        with patch("subprocess.run") as mock_run:
            notify("title", "message")
        mock_run.assert_called_once()
        cmd = mock_run.call_args[0][0]
        assert cmd[0] == "notify-send"

    def test_missing_notify_send_is_silent(self, monkeypatch):
        monkeypatch.setattr(platform, "system", lambda: "Linux")
        with patch("subprocess.run", side_effect=FileNotFoundError):
            notify("title", "message")


class TestUnsupportedPlatform:
    def test_no_op_on_unknown_os(self, monkeypatch):
        monkeypatch.setattr(platform, "system", lambda: "FreeBSD")
        with patch("subprocess.run") as mock_run:
            notify("title", "message")
        mock_run.assert_not_called()
