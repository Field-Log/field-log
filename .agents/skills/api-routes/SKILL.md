---
name: api-routes
description: Use when adding, changing, reviewing, or documenting apps/api routes in this repo; when touching apps/api/src/app.ts or apps/api/src/routes/**; when updating API path references in apps/web, apps/mobile, packages/logger integration tests, GitHub workflows, or docs.
---

# API Routes

## Overview

Keep the API route surface versioned and predictable. Public API routes are
mounted under static `/api/v1`; do not add unversioned aliases unless the user
explicitly asks for a migration window.

## Generated API Docs

Before adding, changing, reviewing, or documenting API routes, read
`docs/api-docs/index.md`, then read the linked per-path file for every route you
are touching. These files are generated from the Hono OpenAPI document and are
the agent-facing reference for the current public API surface.

When route behavior, request/response schemas, headers, status codes, or public
paths change, regenerate the docs with
`pnpm --filter @app/api run docs:generate`. The API test suite fails when
`docs/api-docs/` is stale relative to the generated OpenAPI document.

## Route Structure

- Keep `apps/api/src/app.ts` thin: create the Hono app and mount versioned
  routers only.
- Put shared route dependencies in `apps/api/src/routes/dependencies.ts`.
- Put version-level wiring in `apps/api/src/routes/v1/index.ts`.
- Put each logical route group under `apps/api/src/routes/v1/<route>/`.
- Define paths inside route groups relative to `/api/v1`. For example, the logs
  router defines `/logs`, and the app exposes it at `/api/v1/logs`.
- Keep the static prefix exported as `apiV1Prefix = "/api/v1"` from the version
  router.

## Required Updates

When route paths change, update every consumer of the public route surface:

- API tests in `apps/api`.
- Generated or derived client env URLs in web/mobile code and tests.
- Logger live integration paths in `packages/logger/integration`.
- GitHub deployment smoke tests and PR preview comments.
- Docs and environment examples.
- `.github/workflows/logger-live.yml` route-change detection when moving files
  that affect logger live behavior.

Use `rg -n --hidden -g '!node_modules/**' -g '!.git/**' '/health|/logs|/api/v1|LOG_PROXY_URL|VITE_LOG_PROXY_URL|EXPO_PUBLIC_LOG_PROXY_URL' .`
as a starting point, then separate true API references from arbitrary sample
payload values.

## Compatibility

Do not keep `/health`, `/logs`, or `/` compatibility aliases by default. Add
temporary aliases only when the user explicitly requests backward compatibility,
and cover both canonical and alias behavior with tests.

## Validation

For code changes, follow the repository validation instructions in `AGENTS.md`.
If changes touch logging or logger live integration, use `$logger` before
format/test/lint/typecheck.
