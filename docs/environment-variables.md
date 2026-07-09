# Environment Variables

Environment variables are validated with `@t3-oss/env-core` at each app or
package boundary that consumes them.

## Web App

The TanStack Start web app in `apps/web` uses Clerk for authentication.

### Infisical

Infisical is organized by deployment/runtime target. The web app loads all local
and deployment variables from `/apps/web`; this is also the catch-all source
path for Vercel secret syncs. Store the exact runtime variable names in this
folder rather than service-specific or locally aliased names.

The web app validates client variables separately from server variables:

- client: `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_SIGN_IN_URL`,
  `VITE_CLERK_SIGN_UP_URL`, optional `VITE_API_BASE_URL`, optional
  `VITE_LOG_PROXY_URL`, optional `VITE_LOG_PROXY_CLIENT_KEY`
- server: `DATABASE_URL`, `CLERK_SECRET_KEY`, optional `AXIOM_TOKEN`, optional
  `AXIOM_DATASET`, optional `AXIOM_EDGE_DOMAIN`, optional `LOG_LEVEL`, optional
  `LOGGER`

Do not expose `CLERK_SECRET_KEY`, `DATABASE_URL`, or Axiom ingest credentials to
client-side code.

## Local Ports

Local development uses stable app ports:

- Web: `http://localhost:4005`
- API Worker: `http://localhost:4006`

Logging environment variables, Axiom setup, and client proxy configuration are
documented in [logger.md](./logger.md).

## API App

`apps/api` loads local development secrets from Infisical environment `dev` at
`/apps/api`. The default API dev command runs `wrangler dev` on port `4006` so
local development uses the Cloudflare Worker runtime. `dev:node` is available
for debugging the legacy local Node Hono server.

Required API values:

- `DATABASE_URL`

Optional API values:

- `APP_ENV`
- `AXIOM_TOKEN`
- `AXIOM_DATASET`
- `AXIOM_EDGE_DOMAIN`
- `LOG_LEVEL`
- `LOGGER`
- `LOG_PROXY_CLIENT_KEY`
- `PORT`, local Node server only

Cloudflare Worker production and preview secrets are synchronized from
Infisical `/apps/api` into Cloudflare Workers. See
[cloudflare-api.md](./cloudflare-api.md).

## FigJam / Figma Agent Bridge

Codex and Claude use the FigJam bridge through the dedicated Figma/FigJam
integration account. Store these values in Infisical at `/local/figma`:

- `FIGMA_ACCESS_TOKEN`: Personal Access Token for the dedicated account.
- `FIGMA_FIGJAM_FILE_KEY`: Primary FigJam planning board file key.
- `FIGMA_FIGJAM_ALLOWED_FILE_KEYS`: Comma-separated allowlist containing the
  primary FigJam planning board key and the separate Figma design file key used
  for web and mobile UI designs.
- `GIT_BRANCH`: Optional. Included in generated payload metadata.
- `GIT_COMMIT`: Optional. Included in generated payload metadata.

Do not expose `FIGMA_ACCESS_TOKEN` to client-side code. Run local commands
through Infisical:

```sh
infisical run --env=dev --path=/local/figma -- pnpm figjam read
```

The FigJam tooling is local-only and must not run against preview or production
Infisical environments.

### Production

Deployment environments should receive these values directly from `/apps/web`,
normally through Infisical App Connections or the hosting platform's
environment variable configuration:

- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_CLERK_SIGN_IN_URL=/sign-in`
- `VITE_CLERK_SIGN_UP_URL=/sign-up`
- `CLERK_SECRET_KEY`
- `DATABASE_URL`
- optional `AXIOM_TOKEN`
- optional `AXIOM_DATASET`
- optional `AXIOM_EDGE_DOMAIN`
- optional `LOG_LEVEL`
- optional `LOGGER`
- optional `SITE_URL`

### Site Origin (Open Graph / canonical URLs)

Server-rendered shareable URLs (`og:url`, `og:image`, `<link rel="canonical">`)
need an absolute origin. It resolves in this order:

- `SITE_URL` — explicit override for any environment, e.g.
  `https://field-log.com`.
- `VERCEL_PROJECT_PRODUCTION_URL` — the Vercel production domain (provided
  automatically on Vercel); used for preview and production deployments so links
  canonicalize to production.
- Local development — neither is set, so URLs are emitted relative to the current
  host. Nothing is hardcoded, so a changed dev port cannot produce wrong URLs.

## Mobile App

`apps/mobile` validates JavaScript-visible Expo values with
`@t3-oss/env-core`. Mobile configuration that must be available to app
JavaScript should use Expo's `EXPO_PUBLIC_` prefix and must not contain secrets.

Current mobile variables:

- optional `EXPO_PUBLIC_API_BASE_URL`
- optional `EXPO_PUBLIC_LOG_PROXY_URL`
- optional `EXPO_PUBLIC_LOG_PROXY_CLIENT_KEY`

Mobile commands load these values from `/apps/mobile`.
Server-only values such as `DATABASE_URL` and `CLERK_SECRET_KEY` should stay
behind `apps/api` or web server code.

## Database Package

`packages/database` validates `DATABASE_URL` when it is present in
`drizzle.config.ts`. The variable is optional at config load time so commands
that do not need database credentials can still run.

## GitHub Discord Notifications

The `Discord Notifications` GitHub Actions workflow posts repository events to
Discord. It authenticates to Infisical with GitHub OIDC and reads the webhook
URL from `/tools/github-discord-notifier`.

Infisical must provide:

- `DISCORD_GITHUB_WEBHOOK_URL`

GitHub Actions must provide:

- `GITHUB_EVENT_NAME`
- `GITHUB_EVENT_PATH`
- `GITHUB_REPOSITORY`

GitHub Actions may provide:

- `GITHUB_RUN_ID`
- `GITHUB_SHA`
- `GITHUB_SERVER_URL`, defaults to `https://github.com`

GitHub repository variables must provide the Infisical OIDC configuration:

- `INFISICAL_DISCORD_NOTIFIER_IDENTITY_ID`
- `INFISICAL_PROJECT_SLUG`
- optional `INFISICAL_ENV_SLUG`, defaults to `dev`
- optional `INFISICAL_OIDC_AUDIENCE`, defaults to
  `https://github.com/{repository_owner}`
- optional `INFISICAL_DOMAIN`, defaults to `https://app.infisical.com`

The Discord notifier identity should be scoped to
`/tools/github-discord-notifier`. Fork pull requests are skipped because GitHub
does not expose OIDC-backed secret access to untrusted fork code paths.
