# SkillConform 2.0 direction

SkillConform is evolving from a focused static checker into an open-source CI and test suite for Agent Skills.

## Product boundary

SkillConform should answer four different questions without pretending they are the same:

1. **Conformance** — is the skill structurally valid and portable against the Agent Skills specification?
2. **Capability surface** — what tools, network access, local resources, and bundled scripts does it appear to require?
3. **Security review** — does deterministic analysis find risky instructions, embedded secrets, broad permissions, or suspicious operations?
4. **Behavioral regression** — when a skill changes, do repository-owned evaluation cases still meet their expected contract?

The project intentionally does **not** position itself as a replacement for full malware scanners, sandboxes, or LLM-based semantic security systems.

## Differentiation

The primary differentiator is the combination of:

- deterministic checks with no API key;
- machine-readable capability inventory;
- repository-owned policy and regression tests;
- CI-native JSON and SARIF output;
- future cross-agent compatibility adapters;
- future behavioral evaluation runners that compare versions rather than returning a vague quality score.

Security-only scanning is a crowded space. SkillConform should interoperate with specialist scanners instead of duplicating their entire rule catalog.

## Architecture principles

- Keep the default path deterministic and local.
- Never execute target skill scripts during static analysis.
- Separate evidence collection from policy decisions.
- Keep stable rule IDs and versioned machine-readable schemas.
- Treat each client adapter as an explicit compatibility profile, not a marketing claim that every skill works everywhere.
- Make contribution surfaces small: rules, fixtures, adapters, evaluator cases, documentation corrections, and integrations.

## 2.0 milestones

### Foundation
- Capability inventory command and TypeScript API.
- Versioned inventory schema.
- Explicit CLI/API contracts and fixture tests.
- Public architecture and comparison documentation.

### Portability
- Client compatibility profiles for major Agent Skills hosts.
- A matrix command that reports tested/untested/unsupported features by profile.
- Community-maintained compatibility fixtures.

### Behavioral regression
- Versioned evaluation manifest.
- Baseline-versus-candidate comparisons.
- Deterministic assertions before optional model-based judges.
- Reproducible adapters for supported agent CLIs.

### Ecosystem
- Public compatibility corpus drawn from opt-in/open repositories.
- GitHub Action annotations and reusable workflows.
- Plugin API for third-party rules and adapters.
- Published schemas and benchmark results.

## Adoption integrity

Project metrics must come from real users and independent contributors. Do not manufacture stars, downloads, forks, contributors, or dependency relationships. The project should earn adoption by being useful enough to install in real repositories.
