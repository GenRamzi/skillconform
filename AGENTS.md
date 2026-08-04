# Repository instructions

## Required checks

Run these before proposing a change:

```bash
npm run check
npm test
npm run test:self
node dist/src/cli.js audit skills --fail-on warning
```

## Trust boundary

- Never execute scripts from a target skill during default scanning or tests.
- Keep network access out of the deterministic scanner.
- Treat target files as untrusted input and avoid following symlinks.
- Do not weaken secret, path-escape, or destructive-command findings merely to make fixtures pass.

## Rule changes

- Use stable `SC` IDs for conformance and `SEC` IDs for security.
- Add a triggering fixture and a non-triggering test.
- Give every finding a direct remediation.
- Update `docs/rules.md` and `CHANGELOG.md` when behavior changes.

## Compatibility

Maintain Node.js 20 support and deterministic output. Avoid new runtime dependencies unless they remove substantially more complexity than they add.
