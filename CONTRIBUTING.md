# Contributing to pomoflow

## Branching Strategy

This project follows **GitFlow**:

| Branch | Purpose |
|--------|---------|
| `main` | Stable releases only — protected, no direct pushes |
| `develop` | Integration branch for features |
| `feature/<name>` | One feature per branch, branched from `develop` |
| `release/<version>` | Release preparation, branched from `develop` |
| `hotfix/<name>` | Urgent fixes branched from `main` |

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

Types: feat, fix, docs, style, refactor, test, ci, chore
```

Examples:
```
feat(timer): add countdown display with color coding
fix(history): correct session timestamp timezone
docs(readme): add installation instructions
ci(actions): add Python matrix testing
```

## Development Setup

```bash
git clone https://github.com/guialmm/pomoflow.git
cd pomoflow
pip install -e ".[dev]"
pre-commit install --hook-type commit-msg
pre-commit install
```

## Pull Request Process

1. Branch from `develop`: `git checkout -b feature/my-feature develop`
2. Write tests for new functionality
3. Ensure all hooks pass: `pre-commit run --all-files`
4. Open a PR targeting `develop`
5. PRs require at least one review before merging

## Versioning

This project uses [Semantic Versioning](https://semver.org/). Versions are bumped automatically via `commitizen` based on commit types.
