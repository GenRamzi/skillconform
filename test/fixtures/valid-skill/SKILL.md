---
name: valid-skill
description: Summarize plain-text project notes into concise action items. Use when a user asks to organize notes, decisions, or follow-up tasks.
license: Apache-2.0
compatibility: Requires Node.js 20 or later. No network access.
metadata:
  author: skillconform-tests
  version: "1.0.0"
allowed-tools: Bash(node:*) Read
---

# Summarize notes

1. Read the notes supplied by the user.
2. Separate decisions, owners, deadlines, and unresolved questions.
3. Return a concise checklist without inventing missing details.

Run [the deterministic helper](scripts/hello.mjs) only when a smoke test is requested.
