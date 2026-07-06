# Environment Variables

Environment variables are validated with `@t3-oss/env-core` at each app or
package boundary that consumes them.

## Web App

The TanStack Start web app in `apps/web` uses Clerk for authentication.

### Local Development

Local commands should load Clerk values through Infisical:

- `/clerk` provides `CLERK_PUBLISHABLE_KEY`, `CLERK_SIGN_IN_URL`, and `CLERK_SIGN_UP_URL`
- `/clerk/server` provides `CLERK_SECRET_KEY`

The app exposes the public Clerk values to Vite as `VITE_CLERK_PUBLISHABLE_KEY`,
`VITE_CLERK_SIGN_IN_URL`, and `VITE_CLERK_SIGN_UP_URL`.
Do not expose `CLERK_SECRET_KEY` to client-side code.

The web app validates client variables separately from server variables:

- client: `VITE_CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_SIGN_IN_URL`,
  `VITE_CLERK_SIGN_UP_URL`
- server: `DATABASE_URL`, `CLERK_SECRET_KEY`

### Production

Deployment environments should provide these values directly, normally through
Infisical App Connections or the hosting platform's environment variable
configuration:

- `VITE_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_SIGN_IN_URL=/sign-in`
- `CLERK_SIGN_UP_URL=/sign-up`

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

Server-only values such as `DATABASE_URL` and `CLERK_SECRET_KEY` should stay
behind `apps/api` or web server code.

## Database Package

`packages/database` validates `DATABASE_URL` when it is present in
`drizzle.config.ts`. The variable is optional at config load time so commands
that do not need database credentials can still run.

## GitHub Discord Notifications

The `Discord Notifications` GitHub Actions workflow posts repository events to
Discord. It authenticates to Infisical with GitHub OIDC and reads the webhook
URL from `/github/discord`.

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

The Discord notifier identity should be scoped to `/github/discord`. Fork pull
requests are skipped because GitHub does not expose OIDC-backed secret access to
untrusted fork code paths.
