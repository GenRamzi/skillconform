# Roadmap

SkillConform is evolving toward an open-source CI and test suite for Agent Skills. The guiding principle is to complement specialist security scanners with deterministic portability, capability, and regression evidence.

## v0.2 — Capability and portability foundation

- [x] Versioned capability inventory (`skillconform.capabilities/v1`).
- [x] CLI and TypeScript API for capability inventory.
- [x] Deterministic inventory of declared tools, references, bundled scripts, network hosts, and portability notes.
- [ ] JSON Schema for capability inventory and `skillconform.yaml`.
- [ ] Explicit client compatibility profiles.
- [ ] Configurable rule severities and documented suppressions.
- [ ] Incremental scanning for large repositories.

## v0.3 — Cross-agent compatibility

- Compatibility adapters for major Agent Skills hosts.
- `matrix` command with tested / untested / unsupported evidence per profile.
- Community-maintained compatibility fixtures.
- Shell and PowerShell command-aware analysis.
- Reusable CI examples for multi-agent skill repositories.

## v0.4 — Behavioral regression

- Versioned evaluation manifest.
- Baseline-versus-candidate skill comparisons.
- Deterministic assertions before optional model-based judges.
- Reproducible agent CLI adapters with explicit sandbox and permission contracts.
- Machine-readable evaluation evidence suitable for pull requests.

## v0.5 — Supply chain and ecosystem

- Reproducible skill archives.
- Checksums and provenance manifests.
- Dependency and remote-resource inventory.
- Optional SBOM output for bundled scripts.
- Public opt-in compatibility corpus and benchmark reports.
- Plugin API for third-party rules and adapters.

## v1.0 — Stable policy platform

- Stable rule, inventory, compatibility, and evaluation schemas.
- Versioned migration tooling.
- Editor and marketplace integrations.
- Community-governed compatibility suites and rule packs.

Roadmap items are proposals, not unsupported capability claims. New major behavior should land with tests, documentation, and evidence.
