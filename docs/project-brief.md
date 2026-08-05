# SkillConform project brief

## One sentence

SkillConform is an open-source, deterministic conformance, security-review, and regression-testing toolkit for portable Agent Skills.

## The problem

Agent Skills are easy to share because much of their behavior is expressed in `SKILL.md` and nearby resources. That portability also creates a trust boundary: a skill can contain broken metadata, missing or escaping references, embedded credentials, dangerous shell instructions, overly broad permissions, prompt-injection language, or undeclared network requirements.

Manual review is necessary, but it is difficult to repeat consistently across repositories and releases.

## The product

SkillConform provides a CLI, TypeScript library, GitHub Action, and distributable Agent Skill. It performs deterministic static and policy analysis without requiring an API key and without executing scripts from the inspected skill.

Current capabilities include:

- structural and metadata validation;
- local-reference and portability checks;
- deterministic security rules;
- workspace-wide scanning;
- repository-owned regression expectations;
- terminal, JSON, and SARIF output;
- stable rule identifiers and actionable remediation guidance.

## Who it is for

- Agent Skill authors and maintainers;
- plugin and marketplace operators;
- teams reviewing third-party skills before installation;
- security engineers building AI-agent supply-chain controls;
- CI platform and developer-tool vendors serving agent workflows.

## Differentiation

- **Deterministic first:** identical files produce identical findings.
- **No target execution:** inspected scripts are not run.
- **No model dependency:** core checks do not require an external AI service.
- **CI-native:** thresholds, exit codes, JSON, SARIF, and a reusable GitHub Action are built in.
- **Review evidence, not certification:** findings support human review without claiming that a skill is safe.

## Public proof points

- Versioned GitHub releases: [Releases](https://github.com/GenRamzi/skillconform/releases)
- Installable npm CLI: `npx skillconform`
- Reusable GitHub Action: `GenRamzi/skillconform@v0.1.1`
- Passing CI and CodeQL workflows: [Actions](https://github.com/GenRamzi/skillconform/actions)
- Rule documentation: [Rule reference](rules.md)
- Reproducible walkthrough: [Five-minute demo](quick-demo.md)
- Real-world companion repository: [Creative Agent Skills](https://github.com/GenRamzi/creative-agent-skills), audited with SkillConform in CI

## Near-term milestones

The project should earn credibility through measurable adoption rather than unsupported claims. The next milestones are:

1. Test against at least ten public Agent Skills repositories and preserve sanitized compatibility fixtures.
2. Publish a false-positive and missed-pattern benchmark for the deterministic rules.
3. Secure the first independent repository using the GitHub Action on every pull request.
4. Add community-contributed rules with tests and documented remediation.
5. Publish compatibility notes for Windows, macOS, and Linux.

## Partnership opportunities

- **Early adopters:** run SkillConform in a public skills repository and share reproducible results.
- **Marketplaces:** integrate pre-publication checks or continuous rescanning.
- **Security researchers:** contribute minimized fixtures, rules, and evaluations.
- **Developer platforms:** integrate the JSON or SARIF output into review and policy workflows.
- **Sponsors and investors:** support maintenance, benchmark development, ecosystem integrations, and independent security review.

For a public pilot, integration, research collaboration, or sponsorship discussion, open a GitHub issue with the relevant context and a non-confidential contact path.

## Due-diligence links

- [Architecture](architecture.md)
- [Roadmap](../ROADMAP.md)
- [Security policy](../SECURITY.md)
- [Contribution guide](../CONTRIBUTING.md)
- [License](../LICENSE)
- [Changelog](../CHANGELOG.md)

## Important limitation

SkillConform is static-analysis and policy-review software. It does not prove semantic correctness, replace sandboxing, execute untrusted targets, or certify any skill as secure.
