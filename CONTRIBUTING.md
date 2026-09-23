# Contributing

Thank you for improving SkillConform. Contributions should make Agent Skills easier to trust, test, and move between compatible clients.

SkillConform values **independent, useful contributions**. Do not split trivial edits into multiple pull requests, manufacture contributor activity, or add provider claims that cannot be supported by public evidence.

## Development

Requirements: Node.js 20 or later and npm.

```bash
npm ci
npm run check
npm test
npm run test:self
node dist/src/cli.js audit skills --fail-on warning
npm pack --dry-run
```

## Contribution lanes

You do not need to understand the whole codebase. Pick one bounded lane.

### 1. Compatibility profile or fixture

Good for contributors who use a specific agent host.

A compatibility contribution should include:

- a first-party provider document that describes the behavior;
- the smallest deterministic check that can be justified from that document;
- one fixture that should pass or require review;
- one fixture that demonstrates the documented incompatibility when applicable;
- tests and an update to `docs/compatibility.md`.

Do not infer unpublished runtime behavior. If static evidence cannot prove compatibility, return `review` rather than `pass`.

### 2. Conformance or security rule

A new rule needs:

- a clear specification requirement or concrete risk;
- a stable rule ID and actionable remediation;
- one fixture that should trigger it;
- one fixture that should not trigger it;
- conservative matching that avoids broad prose-only guesses;
- an update to `docs/rules.md`.

False-positive reductions are as valuable as new detections.

### 3. Regression fixture or detector

Regression contributions should use a minimal baseline/candidate pair and explain the trust-surface change being detected.

Examples include:

- a newly added network dependency;
- a broader tool grant;
- a newly bundled script;
- a finding introduced or resolved by a candidate;
- a removed or renamed skill.

Keep deterministic regression evidence separate from future live-agent evaluation.

### 4. Integration example

Useful integrations include public, reproducible examples for:

- GitHub Actions;
- Agent Skill repositories;
- marketplaces or catalogs;
- JSON/SARIF consumers;
- multi-agent compatibility checks.

Examples must use public or sanitized data and should be runnable by another maintainer.

### 5. Minimized bug or false-positive fixture

If SkillConform behaves incorrectly on a public skill, reduce it to the smallest fixture that preserves the bug. A focused fixture plus a failing test is an excellent first contribution.

## Pull requests

1. Open an issue first for new commands, schemas, compatibility profiles, configuration changes, or rule-severity changes.
2. Keep each pull request focused on one independently reviewable problem.
3. Add tests for behavior changes and false-positive fixes.
4. Update the relevant documentation when changing a public contract.
5. Avoid adding network calls or executing target skill scripts in the default scanner.
6. Confirm that `npm pack --dry-run` contains only intended release files.
7. Cite first-party documentation for provider-specific behavior.
8. Never include credentials, private prompts, customer data, or proprietary repository content in fixtures.

## Review standard

A pull request is ready to merge when:

- the behavior is reproducible;
- tests cover the change;
- public schemas or rule IDs remain stable or are intentionally versioned;
- documentation matches the implementation;
- security or compatibility claims are no stronger than the evidence;
- CI passes on the supported Node.js matrix.

## Commit messages

Use concise imperative messages such as `add copilot compatibility fixture`, `detect tool grant expansion`, or `reduce shell detector false positives`.

By contributing, you agree that your contribution is licensed under Apache-2.0 and that you will follow the [Code of Conduct](CODE_OF_CONDUCT.md).
