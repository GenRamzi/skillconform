# Changelog

All notable changes follow the principles of Keep a Changelog and Semantic Versioning.

## [Unreleased]

## [0.3.0] - 2026-09-23

### Added

- Deterministic capability inventory for Agent Skills, including declared tools, local references, bundled scripts, network hosts, and portability signals.
- Versioned cross-agent compatibility profiles and matrix output for Agent Skills, Claude, OpenAI, and Gemini host constraints.
- Expanded regression-policy coverage, compatibility reporting, and community issue templates for reproducible findings.
- Project and launch documentation for early adopters, integrations, and evidence-driven contributions.

### Changed

- Broaden SkillConform from format/security linting into a CI-native conformance, capability, compatibility, and regression toolkit.
- Strengthen CI coverage across Node.js 20, 22, and 24 with SARIF smoke testing and package dry-runs.
- Harden release automation around npm trusted publishing and explicit release gates.

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
