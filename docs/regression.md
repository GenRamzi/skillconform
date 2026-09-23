# Baseline-to-candidate regression gate

SkillConform can compare a candidate skill tree against a known baseline without executing target scripts.

```bash
npx skillconform regress ./candidate/skills --baseline ./baseline/skills
npx skillconform regress ./candidate/skills --baseline ./baseline/skills --fail-on warning
npx skillconform regress ./candidate/skills --baseline ./baseline/skills --format json -o regression.json
```

The output contract is `skillconform.regression/v1`.

## What the deterministic gate detects

The first version reports:

- newly introduced conformance or security findings;
- new network capability;
- new shell usage;
- newly bundled executable/source scripts;
- expansion of `allowed-tools`;
- newly observed network hosts;
- added or removed skills;
- the count of findings resolved by the candidate.

A capability expansion is evidence for review, not proof of malicious behavior. Default `--fail-on error` blocks only new error-level regressions. Teams that want a stricter policy can use `--fail-on warning`.

## Pull-request workflow

A safe workflow can check out the base and head revisions side-by-side and run SkillConform without executing code from either tree:

```yaml
name: Skill regression

on:
  pull_request:

permissions:
  contents: read

jobs:
  skill-regression:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout baseline
        uses: actions/checkout@v7
        with:
          ref: ${{ github.event.pull_request.base.sha }}
          path: baseline
          persist-credentials: false

      - name: Checkout candidate
        uses: actions/checkout@v7
        with:
          ref: ${{ github.event.pull_request.head.sha }}
          path: candidate
          persist-credentials: false

      - name: Compare skills
        uses: GenRamzi/skillconform@v0.4.0
        with:
          mode: regress
          baseline: baseline/skills
          path: candidate/skills
          fail-on: warning
```

For fork pull requests, keep the workflow on the unprivileged `pull_request` event and do not execute scripts from the candidate tree. SkillConform's static regression gate reads files only.

## Why this is separate from live evaluation

Static regression answers: **what changed in the skill's trust and portability surface?**

Live evaluation answers: **did an agent perform the task better or worse with this skill?**

Keeping these evidence classes separate makes pull-request decisions easier to audit. Future evaluation adapters can attach runtime evidence without weakening the deterministic gate.
