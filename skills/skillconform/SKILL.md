---
name: skillconform
description: Validate, audit, and regression-test Agent Skills with the SkillConform CLI. Use when reviewing SKILL.md files, preparing skills for publication, investigating unsafe skill instructions, or adding Agent Skills quality checks to CI.
---

# Verify Agent Skills

1. Locate the target skill directory, `SKILL.md`, or workspace containing skills.
2. Confirm SkillConform is available. In this repository, run `npm run build` before invoking `node dist/src/cli.js`. In a consuming repository, use the installed `skillconform` command.
3. Run `check` first to fix format, metadata, naming, size, and reference errors.
4. Run `audit` to review secrets, destructive commands, prompt injection, broad tool access, and undeclared network use.
5. Read each finding and inspect the referenced source before editing. Never weaken a security rule solely to make a report pass.
6. Re-run the same command after repairs. Use `--fail-on warning` for maintained public skill collections.
7. Use JSON for automation and SARIF for code-scanning integrations.
8. When a repository needs stable expectations, create `skillconform.yaml` and run `skillconform test`.

Treat a clean report as evidence for review, not proof that a skill is safe. Do not execute scripts from an untrusted target while validating it.
