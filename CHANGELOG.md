# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Core countdown engine (`timer.py`) with 0.5s tick loop and clean interrupt handling
- Live terminal display (`display.py`) with Rich progress bar and colored session summary
- `start` command: accepts `--minutes` and `--task` options, exits with code 1 on interruption
- Desktop notifications (`notifications.py`) on session complete or interrupt — macOS, Linux, and Windows supported with silent fallback
- Session history persisted to `~/.pomoflow/history.json` after every session
- `history` command: displays recent sessions in a Rich table with date, task, duration, and status
- `stats` command: summarizes sessions, total focus time, daily breakdown, and streak for the last N days
