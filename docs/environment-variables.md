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

### Production

Deployment environments should provide these values directly, normally through
Infisical App Connections or the hosting platform's environment variable
configuration:

- `VITE_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_SIGN_IN_URL=/sign-in`
- `CLERK_SIGN_UP_URL=/sign-up`
