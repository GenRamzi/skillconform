# Cross-agent compatibility profiles

SkillConform compatibility profiles turn documented host constraints into conservative, machine-readable checks.

The command is:

```bash
npx skillconform matrix ./skills
npx skillconform matrix ./skills --format json -o compatibility.json
```

The JSON schema identifier is `skillconform.compatibility/v1`. The initial profile set is versioned `2026-09-23`.

## Status semantics

- `pass`: no blocker is visible from deterministic static evidence for the checks SkillConform currently implements.
- `review`: the skill may work, but host-specific runtime, permissions, discovery placement, or dependencies still need verification.
- `unsupported`: the skill contradicts a documented constraint for that profile.

A `pass` is **not** a claim that the skill was executed successfully on that agent. Runtime claims belong in the future behavioral evaluation layer.

## Initial profiles

| Profile | Evidence encoded |
|---|---|
| Agent Skills standard | Core SkillConform conformance baseline; runtime is host-defined. |
| Claude Code | Claude-specific name constraints, local network model, and project discovery under `.claude/skills/<name>/SKILL.md`. |
| Claude API | Claude-specific name constraints plus the documented no-network and no-runtime-package-install environment. |
| OpenAI Skills | Open Agent Skills compatibility; host-specific permissions are surfaced for review rather than guessed. |
| Gemini CLI | Documented project discovery under `.agents/skills/<name>/SKILL.md`; host-specific permission behavior remains reviewable. |

## Sources

Profiles intentionally cite first-party documentation:

- Agent Skills specification: https://agentskills.io/specification
- Anthropic Agent Skills: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview
- OpenAI Skills: https://developers.openai.com/api/docs/guides/tools-skills
- Google Gemini CLI Agent Skills codelab: https://codelabs.developers.google.com/gemini-cli/how-to-create-agent-skills-for-gemini-cli

When provider behavior changes, update the profile set version, add or change fixtures, and explain the change in the pull request.

## Non-goals

The matrix does not:

- claim that every runtime feature is statically knowable;
- execute untrusted skill scripts;
- infer unpublished provider behavior;
- convert a host-specific permission declaration into a universal permission model;
- replace real runtime evaluations.

The behavioral regression layer will add executable evidence separately so static portability and runtime behavior remain auditable concepts.
