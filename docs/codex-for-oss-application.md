# Codex for Open Source — application evidence

Checked against the public Codex for Open Source application on 2026-09-23. This file is maintainer preparation material, not a claim of selection or endorsement.

## Repository to submit

`https://github.com/GenRamzi/skillconform`

Role: **Primary maintainer**.

Why this repository instead of the maintainer's other projects: SkillConform has the clearest combination of active maintenance, public releases, CI, a reusable GitHub Action, deterministic security/conformance checks, SARIF output, and versioned compatibility profiles for Agent Skills, Claude, OpenAI, and Gemini. Independent adoption is still early and must not be overstated.

## Current evidence

- Apache-2.0 public repository.
- Public GitHub releases exist, including stable `v0.3.0` published on 2026-09-23.
- `skillconform@0.3.0` is published publicly on npm through GitHub OIDC trusted publishing with provenance.
- CI covers Node 20, 22, and 24 plus a SARIF smoke test.
- The project exposes a CLI, TypeScript API, GitHub Action, capability inventory, compatibility matrix, deterministic security rules, and regression policies.
- Issue templates explicitly invite compatibility evidence and deterministic regression cases.
- Creative Agent Skills is a public **self-owned** integration and is not counted as independent adoption.
- ArgWitness and AgentProof are related maintainer projects, not downstream-user evidence.
- Do not claim download counts, external contributors, or downstream dependents unless rechecked from an authoritative source at submission time.

## Draft: why is this repository eligible? (<=500 characters)

SkillConform is an Apache-2.0 CLI, library and GitHub Action for deterministic conformance, security review, capability inventory and cross-agent compatibility checks for Agent Skills. v0.3.0 is published on npm with GitHub provenance, with CI on Node 20/22/24, SARIF output, and profiles for Claude, OpenAI and Gemini. I am the primary maintainer; adoption is early and I am not inflating usage metrics.

## Draft: how would API credits be used? (<=500 characters)

I would use Codex API credits to triage reproducible compatibility/security reports, propose regression fixtures, review PRs, maintain versioned host profiles, and assist release workflows. Model suggestions would remain gated by deterministic tests, documented sources and human review; Codex would reduce maintainer toil rather than serve as an oracle for compatibility or security.

## Draft: anything else? (<=500 characters)

SkillConform is part of a small reliability toolchain I maintain: ArgWitness produces concrete counterexamples for breaking AI-tool schemas, while AgentProof explores independent verification of test/CI claims. I keep self-owned demos separate from external adoption and do not manufacture stars, downloads, contributors or dependents.

## Submission checklist

Immediately before submitting, recheck the public repository metrics and release state, use the email associated with the intended OpenAI account, and provide an OpenAI organization ID only if requesting API credits. Keep every adoption statement independently verifiable.
