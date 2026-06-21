import platform
import subprocess


def notify(title: str, message: str) -> None:
    """Send a desktop notification. Fails silently if unsupported."""
    system = platform.system()
    if system == "Darwin":
        _notify_macos(title, message)
    elif system == "Linux":
        _notify_linux(title, message)
    elif system == "Windows":
        _notify_windows(title, message)


def _notify_macos(title: str, message: str) -> None:
    script = f'display notification "{message}" with title "{title}"'
    try:
        subprocess.run(
            ["osascript", "-e", script],
            check=False,
            capture_output=True,
        )
    except FileNotFoundError:
        pass


def _notify_linux(title: str, message: str) -> None:
    try:
        subprocess.run(
            ["notify-send", title, message],
            check=False,
            capture_output=True,
        )
    except FileNotFoundError:
        pass


def _notify_windows(title: str, message: str) -> None:
    # win10toast is an optional dependency; import only when needed
    try:
        from win10toast import ToastNotifier  # type: ignore[import]

        ToastNotifier().show_toast(title, message, duration=5, threaded=True)
    except ImportError:
        pass
    except Exception:  # noqa: BLE001  - toast failures must never crash the timer
        pass
