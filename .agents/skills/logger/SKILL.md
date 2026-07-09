---
name: logger
description: Use when making or reviewing code changes in this repo that add, edit, or touch logging in apps/web, apps/api, apps/mobile, packages/services, or packages/database; when replacing console.*; when adding logger messages or protocol values; or before validation after code changes to audit shared logger usage.
---

# Logger

Use the shared `@package/logger` package for application and service logging. Keep log event names stable and reusable through centralized constants.

## Required Audit

After code changes and before format/test/lint/typecheck:

1. Rely on `pnpm lint`/Biome to reject `console.*` in audited app/package source paths.
2. Rely on `pnpm lint`/Biome to reject `@package/logger` imports from `packages/database/src`.
3. Replace `console.*` in `apps/web`, `apps/api`, `apps/mobile`, and `packages/services` with the shared logger.
4. Do not add logger usage to `packages/database`; keep it storage-only. If database behavior needs logging, log from `packages/services`.
5. Reuse `loggerMessages` and `loggerValues` from `@package/logger`.
6. Add a new message/value only when no relevant constant exists.
7. Prefer broadening or moving an existing constant to `common` or a domain namespace when one event name can correctly serve multiple callers.

## Import Patterns

- API and server-side service code: use the configured service logger from the app-local services module, usually `s.logger`.
- Browser code in `apps/web`: import `logger` from `@/lib/logger`.
- Expo code in `apps/mobile`: import `logger` from `./src/lib/logger` or the correct relative path.
- Logger constants: import `loggerMessages` and `loggerValues` from `@package/logger`.

## Message Rules

- Use stable event IDs such as `api.server.listening` or `database.users.ensure`.
- Put dynamic values in `attributes`, not in the message string.
- Use `logger.operation(name, action, data)` for timed service work.
- For identifiers in service/database logs, use the existing hashed identifier pattern; do not log raw Clerk IDs or user IDs.
- Include errors through the logger data object, for example `logger.warn(message, { error, attributes })`.

## Allowed Console Usage

Do not use `console.*` in:

- `apps/web`
- `apps/api`
- `apps/mobile`
- `packages/services`
- `packages/database/src`

Console usage is allowed where the logger package implements transports and in CLI/bootstrap tooling such as `packages/infisical-runner`.
