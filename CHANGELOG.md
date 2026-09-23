# Changelog

All notable changes follow the principles of Keep a Changelog and Semantic Versioning.

## [Unreleased]

## [0.4.0] - 2026-09-23

### Added

- Baseline-to-candidate regression reports with the `skillconform.regression/v1` contract.
- Deterministic detection of new findings, network/shell capability expansion, bundled scripts, tool permission expansion, and new network hosts.
- `regress` CLI and TypeScript API plus GitHub Action support for pull-request gates.

### Fixed

- Normalize detected URL evidence to hostnames instead of storing URL paths in `networkHosts`.

## [0.3.0] - 2026-09-23

### Added

- Versioned cross-agent compatibility profiles and `skillconform.compatibility/v1`.
- `matrix` CLI/API support for Agent Skills, Claude Code, Claude API, OpenAI Skills, and Gemini CLI.
- Conservative PASS / REVIEW / UNSUPPORTED evidence semantics and provider-specific fixtures.

## [0.2.0] - 2026-09-23

### Added

- Versioned capability inventory with `skillconform.capabilities/v1`.
- `inventory` CLI/API and GitHub Action mode for tools, references, scripts, network hosts, and portability notes.


## [0.1.1] - 2026-08-04

### Fixed

- Make test discovery deterministic and compatible across Node.js 20, 22, and 24.
- Align the first npm release with the current repository state instead of the earlier `v0.1.0` tag.

### Changed

- Update the official GitHub Actions used by CI, CodeQL, artifacts, and releases.
- Update TypeScript and Node.js development types.
- Automate version-based npm publication and GitHub release creation.
- Add direct `npx` onboarding, npm badges, a visual terminal demo, and a five-minute walkthrough.

## [0.1.0] - 2026-08-04

### Added

- Agent Skills conformance validation.
- Deterministic security audit rules.
- Workspace scanning and stable finding IDs.
- Pretty, JSON, and SARIF reports.
- Repository-owned policy regression tests.
- GitHub Action, CI workflow, TypeScript API, and distributable SkillConform skill.
