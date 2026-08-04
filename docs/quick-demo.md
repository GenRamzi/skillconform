# Five-minute demo

This demo shows the shortest path from an Agent Skills repository to a repeatable local and CI quality gate.

## 1. Scan a skill collection

```bash
npx skillconform audit ./skills --fail-on warning
```

A clean collection produces output in this shape:

```text
SkillConform audit
Scanned 7 skills.

0 error(s), 0 warning(s), 0 note(s)
PASS
```

A non-zero result includes the stable rule ID, file location, explanation, and a suggested repair. Review the finding before suppressing it.

## 2. Generate SARIF

```bash
npx skillconform audit ./skills \
  --format sarif \
  --output skillconform.sarif
```

The SARIF file can be archived by CI or uploaded to a compatible code-scanning surface.

## 3. Add a regression policy

Create a starter file:

```bash
npx skillconform init
```

Then keep important expectations in version control:

```yaml
version: 1
tests:
  - name: public skills stay clean
    path: skills
    mode: audit
    expect:
      errors: 0
      warningsAtMost: 0
```

Run the policy:

```bash
npx skillconform test skillconform.yaml
```

## 4. Add the GitHub Action

```yaml
name: Agent Skill quality

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

jobs:
  skillconform:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: GenRamzi/skillconform@v0.1.0
        with:
          path: skills
          mode: audit
          fail-on: warning
```

Pin to a release tag or immutable commit SHA in maintained repositories.

## What to try next

- Add a deliberately missing local reference and confirm `SC018` is reported.
- Place a fake test credential inside a fixture and confirm `SEC002` is reported.
- Compare pretty, JSON, and SARIF output for the same target.
- Add a policy expectation before changing a rule or skill collection.

SkillConform performs static and policy analysis. A clean report supports review; it is not a security certification and does not replace sandboxing or least-privilege tool access.
