# Releasing SkillConform

SkillConform uses npm trusted publishing from GitHub Actions. The release workflow intentionally does **not** use a long-lived `NPM_TOKEN`.

## One-time npm configuration

In the npm package settings for `skillconform`, configure a GitHub Actions trusted publisher with:

- Organization or user: `GenRamzi`
- Repository: `skillconform`
- Workflow filename: `release.yml`
- Environment: leave unset unless a matching GitHub environment is deliberately added
- Allowed action: permit direct `npm publish`

The repository side grants `id-token: write` and runs on a GitHub-hosted runner with Node 24 and an npm CLI that supports OIDC trusted publishing.

If the npm registry no longer exposes the existing package, stop and resolve package ownership/first-publication state before creating a release. Do not describe a version as published until the registry and GitHub Release both confirm it.

## Release gates

Before publishing:

1. Main CI must be green.
2. `package.json`, `package-lock.json`, and `CHANGELOG.md` must agree on the intended version and release contents.
3. Run the release workflow only for that exact package version.
4. Prefer an immutable tag such as `v0.3.0`. A manual dispatch must supply the exact package version.
5. Confirm the npm version and GitHub Release after the workflow finishes.

The workflow re-runs type checks, tests, self-tests, a warning-level audit of the bundled skill, and `npm pack --dry-run` before publishing.

## Why the workflow changed

The September 23, 2026 `0.3.0` release attempts initially passed all repository validation and failed only at token-authenticated `npm publish`. After the npm trusted publisher was configured, `v0.3.0` published successfully through GitHub OIDC with provenance and a matching GitHub Release. The permanent workflow now keeps only tag and explicit manual-dispatch release paths.
