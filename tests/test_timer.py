from unittest.mock import patch

from pomoflow.timer import make_session, run_timer


def test_run_timer_completes():
    ticks = []

    with patch("time.sleep"), patch("time.monotonic", side_effect=[0, 0, 61]):
        completed, elapsed = run_timer(1, on_tick=lambda e, t: ticks.append(e))

    assert completed is True
    assert elapsed == 60


def test_run_timer_interrupted():
    call_count = 0

    def on_tick(elapsed: int, total: int) -> None:
        nonlocal call_count
        call_count += 1
        if call_count == 2:
            raise KeyboardInterrupt

    with patch("time.sleep"), patch("time.monotonic", side_effect=[0, 10, 10, 10]):
        completed, elapsed = run_timer(1, on_tick=on_tick)

    assert completed is False


def test_make_session_completed():
    session = make_session(25, "Write tests", elapsed=1500, completed=True)
    assert session.completed is True
    assert session.elapsed_minutes == 25.0
    assert session.task == "Write tests"


def test_make_session_interrupted():
    session = make_session(25, "", elapsed=300, completed=False)
    assert session.completed is False
    assert session.elapsed_minutes == 5.0
