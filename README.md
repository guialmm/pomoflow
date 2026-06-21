# pomoflow

A focused Pomodoro CLI timer for developers, built with Python and [Typer](https://typer.tiangolo.com/).

[![CI](https://github.com/guialmm/pomoflow/actions/workflows/ci.yml/badge.svg)](https://github.com/guialmm/pomoflow/actions/workflows/ci.yml)
[![Python](https://img.shields.io/badge/python-3.11%2B-blue)](https://www.python.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Features

- Pomodoro timer with customizable durations
- Desktop notifications when a session ends
- Session history and daily statistics
- Per-project configuration

## Installation

```bash
pip install pomoflow
```

## Usage

```bash
# Start a 25-minute Pomodoro
pomoflow start

# Start with a task label
pomoflow start --task "Implement login feature"

# Custom duration
pomoflow start --minutes 45

# View today's stats
pomoflow stats

# Show session history
pomoflow history
```

## Development

```bash
git clone https://github.com/guialmm/pomoflow.git
cd pomoflow
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
