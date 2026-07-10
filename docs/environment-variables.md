# Environment Variables

Environment variables are validated at the app or package boundary that consumes
them. Keep variable names exact; do not store locally aliased names in Infisical,
Vercel, Cloudflare, or GitHub Actions.

Required values use these labels:

- `All`: Dev, Stg, and Prod.
- `Dev`: local development.
- `Stg`: preview and staging surfaces, including Vercel Preview and Cloudflare
  preview/staging.
- `Prod`: production.
- `? (All)`, `? (Dev)`, `? (Stg)`, `? (Prod)`: optional for those surfaces.

## Local Ports

| Service | URL | Notes |
| --- | --- | --- |
| API Worker | `http://localhost:4006` | Wrangler dev server for `apps/api`. |
| Web | `http://localhost:4005` | TanStack Start app in `apps/web`. |

Logging environment variables, Axiom setup, and client proxy configuration are
documented in [logger.md](./logger.md).

## Infisical Values To Set

Store runtime values in Infisical by app or service path. Deployment systems may
sync or copy these values into Vercel, Cloudflare Workers, or local command
environments.

### Web App: `/apps/web`

The TanStack Start web app in `apps/web` uses Clerk for authentication and
server-side database access. This path is also the source folder for Vercel
secret syncs.

| Variable | What it is for | Required | Important notes |
| --- | --- | --- | --- |
| `API_PREVIEW_WORKER_HOST`[^2] | Stable Cloudflare preview Worker host used to derive PR API URLs. | Stg | `C` |
| `AXIOM_DATASET` | Axiom dataset for web logs. | ? (All) | `S` |
| `AXIOM_EDGE_DOMAIN` | Optional Axiom edge domain. | ? (All) | `S` |
| `AXIOM_TOKEN` | Axiom ingest token for server-side web logs. | ? (All) | `S` |
| `CLERK_SECRET_KEY` | Clerk server SDK secret key. | All | `S` |
| `DATABASE_URL`[^1] | Web server runtime database connection. | All | `S` |
| `LOGGER` | Console logger mode. | ? (All) | `S` |
| `LOG_LEVEL` | Minimum logger level. | ? (All) | `S` |
| `SITE_URL` | Explicit absolute site origin for canonical and Open Graph URLs. | ? (All) | `S` |
| `VITE_API_BASE_URL` | API base URL used by browser requests. | ? (All) | `C` |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk browser SDK publishable key. | All | `C` |
| `VITE_CLERK_SIGN_IN_URL` | Clerk sign-in route. | All | `C` |
| `VITE_CLERK_SIGN_UP_URL` | Clerk sign-up route. | All | `C` |
| `VITE_LOG_PROXY_CLIENT_KEY` | Optional client key sent to the API log proxy. | ? (All) | `C` |
| `VITE_LOG_PROXY_URL` | Client log proxy endpoint. | ? (All) | `C` |

Legend: `S` = server-only. `C` = client-visible.

### API App: `/apps/api`

`apps/api` runs on Cloudflare Workers. Local development uses Wrangler, and
deployment secrets are written to Workers through Wrangler `--secrets-file`.

| Variable | What it is for | Required | Important notes |
| --- | --- | --- | --- |
| `AXIOM_DATASET` | Axiom dataset for API logs. | ? (All) | `S` |
| `AXIOM_EDGE_DOMAIN` | Optional Axiom edge domain. | ? (All) | `S` |
| `AXIOM_TOKEN` | Axiom ingest token for API logs. | ? (All) | `S` |
| `DATABASE_URL`[^3] | API database connection string. | All | `S` |
| `LOGGER` | Console logger mode. | ? (All) | `S` |
| `LOG_LEVEL` | Minimum logger level. | ? (All) | `S` |
| `LOG_PROXY_CLIENT_KEY` | Optional key required by `POST /logs`. | ? (All) | `S` |
| `PORT` | Legacy local Node server port. | ? (Dev) | `S` |

Legend: `S` = server-only. `C` = client-visible.

### Cloudflare Deploy Tools: `/tools/cloudflare`

Cloudflare deployment credentials are separate from API runtime secrets.

| Variable | What it is for | Required | Important notes |
| --- | --- | --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account selected by Wrangler. | All | `S` |
| `CLOUDFLARE_API_TOKEN` | Wrangler authentication for deploys. | All | `S` |
| `CLOUDFLARE_WORKERS_SUBDOMAIN` | workers.dev account subdomain used to form PR preview URLs. | Stg | `S` |

Legend: `S` = server-only. `C` = client-visible.

See [cloudflare-api.md](./cloudflare-api.md) for deployment flow details.

### Mobile App: `/apps/mobile`

`apps/mobile` validates JavaScript-visible Expo values. Values available to app
JavaScript must use Expo's `EXPO_PUBLIC_` prefix.

| Variable | What it is for | Required | Important notes |
| --- | --- | --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | API base URL for mobile requests. | ? (All) | `C` |
| `EXPO_PUBLIC_LOG_PROXY_CLIENT_KEY` | Optional client key sent to the API log proxy. | ? (All) | `C` |
| `EXPO_PUBLIC_LOG_PROXY_URL` | API log proxy URL. | ? (All) | `C` |

Legend: `S` = server-only. `C` = client-visible.

### Database Commands

`packages/database` validates `DATABASE_URL` when it is present in
`drizzle.config.ts`. The variable is optional at config load time so commands
that do not need database credentials can still run.

| Variable | What it is for | Required | Important notes |
| --- | --- | --- | --- |
| `DATABASE_URL`[^4] | Drizzle migration and database command connection string. | All | `S` |

Legend: `S` = server-only. `C` = client-visible.

### FigJam / Figma Agent Bridge: `/local/figma`

Codex and Claude use the FigJam bridge through the dedicated Figma/FigJam
integration account.

| Variable | What it is for | Required | Important notes |
| --- | --- | --- | --- |
| `FIGMA_ACCESS_TOKEN` | Personal Access Token for the dedicated integration account. | Dev | `S` |
| `FIGMA_FIGJAM_ALLOWED_FILE_KEYS` | Comma-separated allowlist of FigJam/Figma file keys. | Dev | `S` |
| `FIGMA_FIGJAM_FILE_KEY` | Primary FigJam planning board file key. | Dev | `S` |
| `GIT_BRANCH` | Optional payload metadata. | ? (Dev) | `S` |
| `GIT_COMMIT` | Optional payload metadata. | ? (Dev) | `S` |

Legend: `S` = server-only. `C` = client-visible.

Run local FigJam commands through Infisical:

```sh
infisical run --env=dev --path=/local/figma -- pnpm figjam read
```

The FigJam tooling is local-only and must not run against Stg or Prod.

### GitHub Discord Notifier: `/tools/github-discord-notifier`

The `Discord Notifications` workflow reads the webhook URL from Infisical.

| Variable | What it is for | Required | Important notes |
| --- | --- | --- | --- |
| `DISCORD_GITHUB_WEBHOOK_URL` | Discord webhook URL used by the notifier. | All | `S` |

Legend: `S` = server-only. `C` = client-visible.

## GitHub Repository Configuration

Repository variables and secrets configure deploy automation, PR comments,
Neon branch management, Vercel branch environment variables, and GitHub Discord
notifications.

### Repository Variables

| Variable | What it is for | Required | Important notes |
| --- | --- | --- | --- |
| `FIELD_LOG_API_PREVIEW_APP_CLIENT_ID` | GitHub App client ID used for API preview comments. | Stg | `S` |
| `FIELD_LOG_DB_PREVIEW_APP_CLIENT_ID` | GitHub App client ID used for DB preview comments. | Stg | `S` |
| `INFISICAL_CLOUDFLARE_IDENTITY_ID` | Infisical OIDC identity for Cloudflare/API deploy secrets. | Stg, Prod | `S` |
| `INFISICAL_DISCORD_NOTIFIER_IDENTITY_ID` | Infisical OIDC identity for Discord webhook delivery. | All | `S` |
| `INFISICAL_DOMAIN` | Infisical API base URL override. | ? (All) | `S` |
| `INFISICAL_ENV_SLUG` | Infisical environment slug override. | ? (All) | `S` |
| `INFISICAL_LOGGER_IDENTITY_ID` | Infisical OIDC identity for live logger tests. | Stg | `S` |
| `INFISICAL_OIDC_AUDIENCE` | OIDC audience override for Infisical auth. | ? (All) | `S` |
| `INFISICAL_PROJECT_SLUG` | Infisical project selected by GitHub workflows. | All | `S` |
| `NEON_DATABASE_NAME` | Neon database name used for connection URI lookup. | Stg, Prod | `S` |
| `NEON_DATABASE_ROLE` | Neon role name used for connection URI lookup. | Stg, Prod | `S` |
| `NEON_PROJECT_ID` | Neon project managed by DB-aware workflows. | Stg, Prod | `S` |
| `VERCEL_ORG_ID` | Vercel team/org ID for REST API calls. | Stg | `S` |
| `VERCEL_PROJECT_ID` | Vercel project ID for the web app. | Stg | `S` |

Legend: `S` = server-only. `C` = client-visible.

### Repository Secrets

| Secret | What it is for | Required | Important notes |
| --- | --- | --- | --- |
| `FIELD_LOG_API_PREVIEW_APP_PRIVATE_KEY` | Private key for the API preview comment GitHub App. | Stg | `S` |
| `FIELD_LOG_DB_PREVIEW_APP_PRIVATE_KEY` | Private key for the DB preview comment GitHub App. | Stg | `S` |
| `NEON_API_KEY` | Authenticates Neon API calls for branch and connection URI management. | Stg, Prod | `S` |
| `VERCEL_TOKEN` | Authenticates Vercel REST API calls for Preview env vars and deployment lookup. | Stg | `S` |

Legend: `S` = server-only. `C` = client-visible.

### Create `VERCEL_TOKEN`

1. Open Vercel account settings and go to the Access Tokens area.[^5]
2. Create a token for the account or team that owns the web project.
3. Copy the token once and save it as the repository secret `VERCEL_TOKEN`.
4. Keep `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` as repository variables.

GitHub workflows use the token as a bearer token against `https://api.vercel.com`.

### Create `NEON_API_KEY`

1. Open the Neon Console for the organization that owns the project.[^6]
2. Prefer `Settings > API keys > Create new > Project-scoped` and select the
   project used by `NEON_PROJECT_ID`.
3. If project-scoped keys are not suitable, use an organization API key created
   by an organization admin.
4. Copy the token immediately; Neon shows API key tokens only once.
5. Save the token as the repository secret `NEON_API_KEY`.
6. Keep `NEON_PROJECT_ID`, `NEON_DATABASE_NAME`, and `NEON_DATABASE_ROLE` as
   repository variables.

## Platform-Provided Or Managed Values

These values are provided by hosting platforms, GitHub Actions, or local tool
configuration. Do not add them to Infisical or GitHub repository secrets unless
a workflow explicitly starts requiring that.

| Variable | What it is for | Provider | Important notes |
| --- | --- | --- | --- |
| `APP_ENV` | API runtime environment label. | Wrangler | `S` |
| `GITHUB_EVENT_NAME` | GitHub event name. | GitHub Actions | `S` |
| `GITHUB_EVENT_PATH` | Path to the event payload JSON. | GitHub Actions | `S` |
| `GITHUB_REPOSITORY` | Repository owner/name. | GitHub Actions | `S` |
| `GITHUB_RUN_ID` | Workflow run ID for links. | GitHub Actions | `S` |
| `GITHUB_SERVER_URL` | GitHub server base URL. | GitHub Actions | `S` |
| `GITHUB_SHA` | Commit SHA for links. | GitHub Actions | `S` |
| `VERCEL_ENV` | Vercel deployment environment. | Vercel | `S` |
| `VERCEL_GIT_PULL_REQUEST_ID` | Pull request number for Vercel Preview builds. | Vercel | `S` |
| `VERCEL_PROJECT_PRODUCTION_URL`[^7] | Vercel production domain. | Vercel | `S` |

Legend: `S` = server-only. `C` = client-visible.

## Token And Key Permissions

Use least-privilege credentials where the provider supports scoping.

### `FIELD_LOG_API_PREVIEW_APP_PRIVATE_KEY`

- Repository permissions[^8]:
  - Issues: Read and Write.
  - Pull requests: Read and Write.

### `FIELD_LOG_DB_PREVIEW_APP_PRIVATE_KEY`

- Repository permissions[^8]:
  - Issues: Read and Write.
  - Pull requests: Read and Write.

### `NEON_API_KEY`

- Neon project scope[^6]:
  - Prefer a project-scoped organization API key for `NEON_PROJECT_ID`.
  - Must allow listing, creating, deleting, and restoring branches.
  - Must allow pooled connection URI lookup for `NEON_DATABASE_NAME` and
    `NEON_DATABASE_ROLE`.

### `VERCEL_TOKEN`

- Vercel project access[^5]:
  - Must access the team or account that owns `VERCEL_PROJECT_ID`.
  - Must allow project environment variable create/list/delete for Preview.
  - Must allow deployment lookup for the web project.

### `CLOUDFLARE_API_TOKEN`

- Account permissions[^9]:
  - Workers Scripts: Edit.
  - Account Settings: Read.
- Account scope:
  - Limit to the account that owns `field-log.app`.

### `FIGMA_ACCESS_TOKEN`

- Figma access[^10]:
  - Use the dedicated integration account.
  - Token must read the FigJam/Figma files in `FIGMA_FIGJAM_ALLOWED_FILE_KEYS`.

### `AXIOM_TOKEN`

- Axiom access[^11]:
  - Runtime logging tokens need ingest access to the configured dataset.
  - The live logger test token also needs query access for its testing dataset.

[^1]: Vercel Preview uses the shared staging database by default.
    DB-changing PRs get a branch-specific `DATABASE_URL` override.
[^2]: `Stg` here means Vercel Preview. This value is not
    used by the shared staging web deploy.
[^3]: GitHub deploy workflows resolve branch-specific Neon URLs
    and pass them explicitly to Wrangler.
[^4]: `pnpm db:migrate` loads this through the Infisical
    runner. CI preview, staging, and production migrations pass explicit Neon
    branch URLs.
[^5]: Vercel REST API docs say Vercel Access Tokens authenticate API
    requests via `Authorization: Bearer <TOKEN>` and are created in account
    settings: <https://vercel.com/docs/rest-api#authentication>.
[^6]: Neon API key docs describe personal, organization, and
    project-scoped keys, console creation paths, and the one-time token display:
    <https://neon.com/docs/manage/api-keys>.
[^7]: Used as the canonical deployed origin when `SITE_URL`
    is absent.
[^8]: GitHub documents GitHub App permissions here:
    <https://docs.github.com/en/apps/creating-github-apps/setting-up-a-github-app/choosing-permissions-for-a-github-app>.
[^9]: Cloudflare documents API token creation here:
    <https://developers.cloudflare.com/fundamentals/api/get-started/create-token/>.
[^10]: Figma documents personal access tokens here:
    <https://help.figma.com/hc/en-us/articles/8085703771159-Manage-personal-access-tokens>.
[^11]: Axiom documents API token setup here:
    <https://axiom.co/docs/reference/tokens>.
