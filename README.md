# pomoflow

A Pomodoro timer that runs in your terminal. Start a session, focus on what you need to do, and let pomoflow keep track of the time and your progress.

[![CI](https://github.com/guialmm/pomoflow/actions/workflows/ci.yml/badge.svg)](https://github.com/guialmm/pomoflow/actions/workflows/ci.yml)
[![Python](https://img.shields.io/badge/python-3.11%2B-blue)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## What is the Pomodoro technique?

You work in focused blocks of time (usually 25 minutes), then take a short break. After a few blocks, take a longer break. The idea is simple: it is easier to stay focused for 25 minutes than to sit down and "study until you're done." pomoflow handles the timing so you only have to focus on the work.

## Installation

Requires Python 3.11 or newer.

```bash
pip install pomoflow
```

Or, if you use [pipx](https://pipx.pypa.io/) to keep CLI tools isolated:

```bash
pipx install pomoflow
```

## Quick start

```bash
# Start a 25-minute session
pomoflow start

# Label the session so you remember what you were doing
pomoflow start --task "Chapter 3 — Calculus"

# Custom duration
pomoflow start --minutes 50
```

During a session, you will see a live progress bar in the terminal. Press `Ctrl+C` at any time to stop early. When the session ends, your desktop will show a notification and the terminal will ring a bell.

## All commands

### `start` — begin a focus session

```bash
pomoflow start
pomoflow start --task "Physics revision"
pomoflow start --minutes 45 --task "Essay draft"
```

| Option | Short | Default | Description |
|---|---|---|---|
| `--minutes` | `-m` | from config | Session duration in minutes |
| `--task` | `-t` | _(none)_ | Label for this session |

### `config` — adjust your default durations

```bash
# See current settings
pomoflow config

# Change the default session length
pomoflow config --pomodoro 50

# Change break lengths
pomoflow config --short-break 10 --long-break 20

# Go back to defaults
pomoflow config --reset
```

| Option | Default |
|---|---|
| `--pomodoro` | 25 min |
| `--short-break` | 5 min |
| `--long-break` | 15 min |

### `history` — see your recent sessions

```bash
pomoflow history

# Show more entries
pomoflow history --limit 20
```

### `stats` — see how you have been doing

```bash
# Summary for the last 7 days
pomoflow stats

# Last 30 days
pomoflow stats --days 30
```

Shows total sessions, total focus time, completion rate, current streak, and a per-day breakdown.

## Data

pomoflow saves your sessions and config to `~/.pomoflow/`. Nothing is sent anywhere.

```
~/.pomoflow/
├── history.json   # session log
└── config.json    # your preferences
```

## Development

```bash
git clone https://github.com/guialmm/pomoflow.git
cd pomoflow
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
pre-commit install --hook-type commit-msg
pre-commit install
```

Run tests:

```bash
pytest
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## License

MIT — [guialmm](https://github.com/guialmm)
