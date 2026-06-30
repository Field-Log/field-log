# Environment Variables

## Web App

The TanStack Start web app in `apps/web` uses Clerk for authentication.

### Local Development

Local commands should load Clerk values through Infisical:

- `/clerk` provides `CLERK_PUBLISHABLE_KEY`
- `/clerk/server` provides `CLERK_SECRET_KEY`

The app exposes the publishable key to Vite as `VITE_CLERK_PUBLISHABLE_KEY`.
Do not expose `CLERK_SECRET_KEY` to client-side code.

### Production

Deployment environments should provide these values directly, normally through
Infisical App Connections or the hosting platform's environment variable
configuration:

- `VITE_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_SIGN_IN_URL=/sign-in`

