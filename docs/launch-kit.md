# SkillConform launch kit

Use these drafts as starting points. Adapt the opening sentence and examples to each community instead of cross-posting identical text. Never include private skills, credentials, or customer repository content in a public demonstration.

## One-line description

Deterministic conformance, security, and regression testing for portable Agent Skills.

## Short announcement

I released **SkillConform**, an open-source CLI and GitHub Action for reviewing Agent Skills before an agent trusts them.

It checks `SKILL.md` structure and references, detects embedded secrets and risky instructions, flags broad shell access and undeclared network use, supports regression policies, and produces pretty, JSON, or SARIF reports—without an API key and without executing target scripts.

```bash
npx skillconform audit ./skills --fail-on warning
```

The project is in developer preview. I am looking for real-world repositories, false positives, missing rules, and CI feedback.

Repository: https://github.com/GenRamzi/skillconform

## Show HN draft

### Title

Show HN: SkillConform – security and regression testing for Agent Skills

### Body

Agent Skills are increasingly distributed as portable folders centered on `SKILL.md`, but they often cross a meaningful trust boundary: they can request filesystem, shell, network, or external-service access.

I built SkillConform as a deterministic review layer for those repositories. It validates metadata and local references, scans for embedded credentials and high-risk instruction patterns, checks broad tool grants and undeclared network requirements, supports repository-owned regression expectations, and emits terminal, JSON, and SARIF output.

It does not execute target scripts, call an AI model, or claim to certify a skill as safe. The goal is to make obvious format and policy regressions reviewable before installation.

Quick test:

```bash
npx skillconform audit ./skills --fail-on warning
```

I would especially value feedback on false positives, missing security rules, SARIF integration, and portability across Agent Skills clients.

## Reddit draft

### Suggested title

I built an open-source linter and security scanner for Agent Skills

### Post

I have been working on SkillConform, a small TypeScript CLI and GitHub Action for Agent Skills repositories.

Current checks include malformed or vague metadata, missing and escaping references, oversized instruction files, possible credentials, destructive shell patterns, prompt-injection language, broad shell grants, and undeclared network use. It can also keep expected findings and clean-repository invariants in `skillconform.yaml`.

It is deterministic, requires no API key, and does not execute scripts from the target skill.

```bash
npx skillconform check ./my-skill
npx skillconform audit ./skills --format sarif -o skillconform.sarif
```

The project is early, so reports from real repositories are more useful than stars. Please sanitize private content before sharing a reproduction.

## LinkedIn draft

I have released **SkillConform v0.1.1**, an open-source quality and security tool for portable Agent Skills.

Agent Skills are easy to share, but a `SKILL.md` folder can also contain broken references, credentials, risky shell instructions, excessive permissions, and policy regressions. SkillConform adds deterministic checks, stable rule IDs, regression expectations, GitHub Actions integration, and SARIF output without requiring an API key or executing the inspected scripts.

The first release is available as an npm CLI and GitHub Action. I am inviting maintainers to test it against real skill repositories and report false positives, missing rules, and integration gaps.

## X / Bluesky thread

1. I released SkillConform: deterministic conformance, security, and regression testing for Agent Skills.
2. It catches broken metadata and references, possible secrets, destructive shell patterns, prompt-injection language, broad shell grants, and undeclared network use.
3. No API key. No execution of target scripts. Pretty, JSON, and SARIF output.
4. Try it: `npx skillconform audit ./skills --fail-on warning`
5. Early adopters: please report false positives and missing rules with sanitized fixtures.

## Dev.to / Hashnode article outline

### Working title

What should be checked before an AI agent trusts a portable skill?

### Sections

1. Why a Markdown-centered skill still creates a trust boundary.
2. Structural failures: metadata, naming, and broken references.
3. Security-review signals: secrets, shell commands, injection, permissions, and network access.
4. Why deterministic checks complement human review.
5. Turning findings into CI and SARIF.
6. Preventing regressions with repository-owned expectations.
7. Limitations: static analysis is evidence, not certification.
8. A five-minute walkthrough using SkillConform.

## Demo checklist

- Use a disposable public fixture, never a private repository.
- Show one clean skill and one deliberately risky fixture.
- Demonstrate terminal output first, then SARIF or CI.
- Explain one false-positive control rather than claiming perfect detection.
- End with a specific request: test a repository, report a missing rule, or contribute a fixture.
