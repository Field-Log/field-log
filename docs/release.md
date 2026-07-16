# Release Process

The repo release version starts at `0.0.1`. Production deploys are triggered by
annotated `v*` tags, not by merging to `main`.

## PR Requirements

Every pull request must include a Changeset:

```sh
pnpm changeset
```

Mark the PR as `major`, `minor`, or `patch`. See
[changesets.md](./changesets.md) for the short authoring guide. CI runs
`scripts/check-pr-changeset.mjs` on pull requests and fails when no Changeset is
present.

## Release Command

Run releases from `main`:

```sh
pnpm release
```

The command:

1. Requires a clean worktree on `main`.
2. Fetches `origin/main` and tags only after local `HEAD` matches it.
3. Runs `pnpm format`, `pnpm test`, `pnpm lint`, and `pnpm typecheck`.
4. Reads pending Changesets and chooses the highest bump.
5. Updates package versions, `apps/mobile/app.json`, and
   `apps/mobile/src/lib/app-version.ts`.
6. Adds Changeset descriptions to `CHANGELOG.md`.
7. Commits the release metadata, pushes `main`, creates and pushes the
   annotated `v*` tag, then creates the matching GitHub Release.

If all pending Changesets are `patch`, the release bumps only the patch version.

## Initial Release

After this release automation lands on `main`, create the initial repo release:

```sh
pnpm release --initial
```

That creates `v0.0.1` and the matching GitHub Release from the baseline commit.

## Deployment

The pushed `v*` tag triggers:

- `API Deploy`: validates, migrates, deploys the production Cloudflare Worker,
  deploys the production Vercel web app, and smoke-tests both production
  surfaces. Web production waits for API production to pass first.
- `Mobile Release`: builds and submits `apps/mobile` through fastlane on macOS
  runners. Android and iOS run as separate jobs with runner labels
  `mobile-release, android` and `mobile-release, ios`.

Mobile store approval can lag behind the web/API deployment. Patch and minor
releases must remain backward-compatible with the currently available mobile
app. Major releases must keep API and database behavior compatible for at least
one prior mobile major version.

Vercel production Git deployment gating is documented in
[vercel.md](./vercel.md).
