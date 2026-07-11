# ci(database): add db-aware preview deployment

## Summary
- add db-aware preview deployment workflows that create, migrate, and clean up Neon PR branches and branch-specific Vercel `DATABASE_URL` overrides
- add CI logger events for preview database handling, Vercel branch configuration, staging reset, and related deploy decisions
- add the staging refresh workflow and run API deploys/migrations with explicit Neon connection URLs
- add the database migration conflict helper skill and `pnpm db:resolve-conflicts` prompt printer
- consolidate client API URL configuration so web uses `API_URL` aliased to `VITE_API_URL`, mobile uses `EXPO_PUBLIC_API_URL`, and log proxy clients derive `/logs`
- refactor deployment environment variable docs by service/ownership, including Vercel/Neon setup instructions, token permissions, numeric footnotes, sorted tables, and clearer `VERCEL_TEAM_ID`/`NEON_DATABASE_USER` naming
- harden Neon and Vercel CI scripts so JSON log attributes are preserved, surrounding env-var whitespace is trimmed, and Vercel API errors include HTTP status and response body details

## Testing
- `bash -n .github/scripts/neon-database-branch.sh`
- `bash -n .github/scripts/vercel-branch-database-url.sh`
- mocked `prepare-preview` branch-limit path
- mocked Vercel API 403 response path
- logger audit checks for forbidden `console.*` and database logger imports
- `pnpm format`
- `pnpm test`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test:logger:axiom`
- `drizzle-kit check`
