# Environment Variables

## Web App

The TanStack Start web app in `apps/web` uses Clerk for authentication.

### Local Development

Local commands should load Clerk values through Infisical:

- `/clerk` provides `CLERK_PUBLISHABLE_KEY`, `CLERK_SIGN_IN_URL`, and `CLERK_SIGN_UP_URL`
- `/clerk/server` provides `CLERK_SECRET_KEY`

The app exposes the public Clerk values to Vite as `VITE_CLERK_PUBLISHABLE_KEY`,
`VITE_CLERK_SIGN_IN_URL`, and `VITE_CLERK_SIGN_UP_URL`.
Do not expose `CLERK_SECRET_KEY` to client-side code.

## Local Ports

Local development uses stable app ports:

- Web: `http://localhost:4005`
- API: `http://localhost:4006`

Logging environment variables, Axiom setup, and client proxy configuration are
documented in [logger.md](./logger.md).

## FigJam / Figma Agent Bridge

Codex and Claude use the FigJam bridge through the dedicated Figma/FigJam
integration account. Store these values in Infisical at `/figma/figjam`:

- `FIGMA_ACCESS_TOKEN`: Personal Access Token for the dedicated account.
- `FIGMA_FIGJAM_FILE_KEY`: Primary FigJam planning board file key.
- `FIGMA_FIGJAM_ALLOWED_FILE_KEYS`: Comma-separated allowlist containing the
  primary FigJam planning board key and the separate Figma design file key used
  for web and mobile UI designs.
- `FIGMA_FIGJAM_TEAM_ID`: Optional. Only needed if team/project discovery is
  implemented.
- `FIGMA_FIGJAM_PROJECT_ID`: Optional. Only needed if project file discovery is
  implemented.

Do not expose `FIGMA_ACCESS_TOKEN` to client-side code. Run local commands
through Infisical:

```sh
infisical run --env=dev --path=/figma/figjam -- pnpm figjam read
```

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

## GitHub Discord Notifications

The `Discord Notifications` GitHub Actions workflow posts repository events to
Discord. It authenticates to Infisical with GitHub OIDC and reads the webhook
URL from `/github/discord`.

Infisical must provide:

- `DISCORD_GITHUB_WEBHOOK_URL`

GitHub repository variables must provide:

- `INFISICAL_DISCORD_NOTIFIER_IDENTITY_ID`
- `INFISICAL_PROJECT_SLUG`
- optional `INFISICAL_ENV_SLUG`, defaults to `dev`
- optional `INFISICAL_OIDC_AUDIENCE`, defaults to
  `https://github.com/{repository_owner}`
- optional `INFISICAL_DOMAIN`, defaults to `https://app.infisical.com`

The Discord notifier identity should be scoped to `/github/discord`. Fork pull
requests are skipped because GitHub does not expose OIDC-backed secret access to
untrusted fork code paths.
