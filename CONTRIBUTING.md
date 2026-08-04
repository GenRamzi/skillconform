# Contributing

Thank you for improving SkillConform. Contributions should make Agent Skills easier to trust, test, and move between compatible clients.

## Development

Requirements: Node.js 20 or later and npm.

```bash
npm ci
npm run check
npm test
npm run test:self
```

## Pull requests

1. Open an issue first for new commands, configuration changes, or rule-severity changes.
2. Keep each pull request focused on one problem.
3. Add tests for behavior changes and false-positive fixes.
4. Update `docs/rules.md` when adding or changing a rule.
5. Avoid adding network calls or executing target skill scripts in the default scanner.
6. Confirm that `npm pack --dry-run` contains only intended release files.

## Rule quality bar

A new rule needs:

- A clear risk or specification requirement.
- A stable rule ID and actionable remediation.
- One fixture that should trigger it.
- One fixture that should not trigger it.
- Conservative matching that avoids broad prose-only guesses.

## Commit messages

Use concise imperative messages such as `add path traversal rule` or `reduce shell detector false positives`.

By contributing, you agree that your contribution is licensed under Apache-2.0 and that you will follow the [Code of Conduct](CODE_OF_CONDUCT.md).
