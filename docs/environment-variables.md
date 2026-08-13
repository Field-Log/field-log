# Environment Variables

Pocket Trash now has one user-facing runtime: `apps/web` on Vercel. The scraper
runs separately on Railway. Browser logs are forwarded to Axiom through the web
server at same-origin `POST /api/v0/logs`.

## Local Secret Paths

| Path | Used by |
| --- | --- |
| `/apps/web` | Web dev, build, test, and database-backed server code. |
| `/apps/scraper` | Scraper cron and queue commands. |
| `/local/database` | Optional developer-specific `DATABASE_URL_<INITIALS>` overrides. |
| `/local/bunny` | Bunny account audits. |
| `/tools/logger-axiom-test` | Live logger integration test. |
| `/tools/github-discord-notifier` | GitHub-to-Discord notifications. |

## Web

| Variable | Scope | Notes |
| --- | --- | --- |
| `DATABASE_URL` | Server | Postgres connection string. |
| `CLERK_SECRET_KEY` | Server | Clerk server API key. |
| `CLERK_PUBLISHABLE_KEY` | Build/client | Aliased to `VITE_CLERK_PUBLISHABLE_KEY` for Vite. |
| `VITE_CLERK_PUBLISHABLE_KEY` | Client | Clerk browser key. |
| `VITE_CLERK_SIGN_IN_URL` | Client | Sign-in route. |
| `VITE_CLERK_SIGN_UP_URL` | Client | Sign-up route. |
| `AXIOM_TOKEN` | Server | Enables Axiom transport when paired with `AXIOM_DATASET`. |
| `AXIOM_DATASET` | Server | Axiom dataset name. |
| `AXIOM_EDGE_DOMAIN` | Server | Optional Axiom ingest domain. |
| `LOGGER` | Server | `compact` or `verbose` console mode. |
| `LOG_LEVEL` | Server | `trace`, `debug`, `verbose`, `info`, `warn`, `error`, or `fatal`. |
| `LOG_PROXY_CLIENT_KEY` | Server/build | Optional browser log ingestion key. Aliased to `VITE_LOG_PROXY_CLIENT_KEY`. |
| `VITE_LOG_PROXY_CLIENT_KEY` | Client | Optional key sent as `x-log-client-key`. |
| `LOG_DEPLOYMENT_ID` | Server/build | Optional deployment id. Aliased to `VITE_LOG_DEPLOYMENT_ID`. |
| `LOG_DEPLOYMENT_TARGET` | Server/build | Optional deployment target. Aliased to `VITE_LOG_DEPLOYMENT_TARGET`. |
| `IMAGE_FOLDER_PREFIX` | Server | Image folder prefix for preview isolation. |
| `SITE_URL` | Server | Public site origin when needed. |

## Scraper

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | Postgres connection string. |
| `REDIS_URL` | Queue backend. |
| `SCRAPER_CRON_ENABLED` | Enables scheduled scraping on Railway. |
| `IMAGE_FOLDER_PREFIX` | Image folder namespace. |
| `AXIOM_TOKEN`, `AXIOM_DATASET`, `AXIOM_EDGE_DOMAIN`, `LOG_LEVEL`, `LOGGER` | Shared logger configuration. |

## Hosting

| Variable | Used by |
| --- | --- |
| `VERCEL_TOKEN`, `VERCEL_TEAM_ID`, `VERCEL_PROJECT_ID` | Vercel preview and production deployments. |
| `NEON_API_KEY`, `NEON_PROJECT_ID`, `NEON_DATABASE_NAME`, `NEON_DATABASE_USER` | Preview database branches and production database URL resolution. |
| `RAILWAY_API_TOKEN`, `RAILWAY_PROJECT_ID` | Railway scraper preview and production deployments. |
| `BUNNY_STORAGE_ACCESS_KEY`, `BUNNY_STORAGE_ENDPOINT`, `BUNNY_STORAGE_ZONE_NAME`, `IMAGE_CDN_BASE_URL` | Preview image cleanup. |
