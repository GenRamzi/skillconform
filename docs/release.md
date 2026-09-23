# Release and npm trusted publishing

SkillConform publishes from GitHub Actions using npm Trusted Publishing (OIDC). The release workflow does not require a long-lived npm publish token.

## One-time npm configuration

The npm package owner must configure a Trusted Publisher for the existing `skillconform` package:

1. Open the `skillconform` package on npmjs.com.
2. Open **Settings → Trusted publishing**.
3. Add **GitHub Actions** as a trusted publisher.
4. Configure:
   - GitHub organization/user: `GenRamzi`
   - Repository: `skillconform`
   - Workflow filename: `release.yml`
   - Allowed action: enable direct `npm publish`
5. Save the trusted publisher configuration.

The workflow file is `.github/workflows/release.yml`, but npm expects only the filename `release.yml`.

## Workflow security contract

The workflow:

- runs on a GitHub-hosted runner;
- grants `id-token: write` for OIDC;
- uses Node.js 24 and npm 11.15+;
- disables package-manager caching in the release job;
- validates TypeScript, tests, self-policy tests, self-audit, and package contents before publishing;
- calls `npm publish` without `NODE_AUTH_TOKEN`;
- relies on npm to create provenance automatically for trusted publishing;
- creates the GitHub release only after npm publication succeeds or the version already exists.

## Why token publishing was removed

The previous release workflow used the repository secret `NPM_TOKEN`. It successfully published v0.1.1, but later v0.2.0 and v0.3.0 publish attempts were rejected by npm after all project validation passed. Trusted publishing removes the long-lived write credential and binds publishing to this repository and workflow.

## Recovery

If a release fails with an authentication error:

- verify the npm Trusted Publisher values match `GenRamzi/skillconform` and `release.yml` exactly;
- verify direct `npm publish` is allowed for that trusted publisher;
- keep `id-token: write` enabled;
- do not add a write-capable `NODE_AUTH_TOKEN` back as a workaround.

Once the trusted publisher is configured, re-running the failed release or merging the next version bump will perform a fresh OIDC publish.
