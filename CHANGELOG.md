# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Core countdown engine (`timer.py`) with 0.5s tick loop and clean interrupt handling
- Live terminal display (`display.py`) with Rich progress bar and colored session summary
- `start` command: accepts `--minutes` and `--task` options, exits with code 1 on interruption
