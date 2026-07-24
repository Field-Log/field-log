# Environment Variables

Environment variables are validated at the app or package boundary that consumes
them. Keep variable names exact, except where this document calls out a
build-time alias or platform-provided value.

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
| Scraper | `http://localhost:4007` | Railway-targeted health service in `apps/scraper`. |
| Scraper Redis | `redis://localhost:4008` | Docker/OrbStack Redis for local scraper queues. |
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
| `API_PREVIEW_WORKER_HOST`[^3] | Stable Cloudflare preview Worker host used to derive PR API URLs. | Stg | `C` |
| `API_URL`[^2] | API origin used by browser requests and client log proxy posts. | ? (All) | `C` |
| `AXIOM_DATASET` | Axiom dataset for web logs. | ? (All) | `S` |
| `AXIOM_EDGE_DOMAIN` | Axiom edge domain. | ? (All) | `S` |
| `AXIOM_TOKEN` | Axiom ingest token for server-side web logs. | ? (All) | `S` |
| `CLERK_SECRET_KEY` | Clerk server SDK secret key. | All | `S` |
| `DATABASE_URL`[^1] | Web server runtime database connection. | All | `S` |
| `IMAGE_KIT_FOLDER_PREFIX` | Optional ImageKit upload folder namespace. See [ImageKit](./image-kit.md). | ? (All) | `S` |
| `LOGGER` | Console logger mode. | ? (All) | `S` |
| `LOG_LEVEL` | Minimum logger level. | ? (All) | `S` |
| `LOG_PROXY_CLIENT_KEY`[^2] | Client key aliased into the web client log proxy config. | ? (All) | `C` |
| `SITE_URL` | Explicit absolute site origin for canonical and Open Graph URLs. | ? (All) | `S` |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk browser SDK publishable key. | All | `C` |
| `VITE_CLERK_SIGN_IN_URL` | Clerk sign-in route. | All | `C` |
| `VITE_CLERK_SIGN_UP_URL` | Clerk sign-up route. | All | `C` |

Legend: `S` = server-only. `C` = client-visible.

### API App: `/apps/api`

`apps/api` runs on Cloudflare Workers. Local development uses Wrangler. Deployed
Worker runtime secrets are read from Infisical and written by deployment
workflows through Wrangler secret files.

| Variable | What it is for | Required | Important notes |
| --- | --- | --- | --- |
| `AXIOM_DATASET` | Axiom dataset for API logs. | ? (All) | `S` |
| `AXIOM_EDGE_DOMAIN` | Axiom edge domain. | ? (All) | `S` |
| `AXIOM_TOKEN` | Axiom ingest token for API logs. | ? (All) | `S` |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key used by API Clerk middleware. | All | `C` |
| `CLERK_SECRET_KEY` | Clerk secret key used by API Clerk middleware. | All | `S` |
| `DATABASE_URL`[^4] | API database connection string. | All | `S` |
| `LOGGER` | Console logger mode. | ? (All) | `S` |
| `LOG_LEVEL` | Minimum logger level. | ? (All) | `S` |
| `LOG_PROXY_CLIENT_KEY` | Key checked by `POST /api/v0/logs`. | ? (All) | `C` |
| `MOBILE_ANDROID_STORE_URL` | Google Play store URL returned by `GET /api/v0/mobile-version`. | ? (Prod) | `S` |
| `MOBILE_IOS_STORE_URL` | App Store URL returned by `GET /api/v0/mobile-version`. | ? (Prod) | `S` |
| `MOBILE_LATEST_VERSION` | Latest mobile app version advertised to clients. | ? (Prod) | `S` |
| `MOBILE_MIN_SUPPORTED_VERSION` | Oldest mobile app version allowed to continue. | ? (Prod) | `S` |
| `MOBILE_UPDATE_SEVERITY` | Mobile update prompt severity: `none`, `recommended`, or `required`. | ? (Prod) | `S` |

Legend: `S` = server-only. `C` = client-visible.

### Scraper App: `/apps/scraper`

`apps/scraper` runs as one Railway cron service. Railway starts it every 15
minutes, the scraper runs due source jobs and queue processing, then the process
exits.

Use Infisical path `/apps/scraper` for local development and non-Railway secret
source of truth. In Railway, prefer service references for platform-provided
values such as Redis connection strings.

| Variable | What it is for | Required | Important notes |
| --- | --- | --- | --- |
| `APP_ENV` | Runtime environment label for scraper logs. | All | `S` |
| `AXIOM_DATASET` | Axiom dataset for scraper logs. | ? (All) | `S` |
| `AXIOM_EDGE_DOMAIN` | Axiom edge domain. | ? (All) | `S` |
| `AXIOM_TOKEN` | Axiom ingest token for scraper logs. | ? (All) | `S` |
| `DATABASE_URL` | Scraper database connection string. | All | `S` |
| `GRIMSMO_PROXY_URL` | Optional proxy URL for Grimsmo source fetches. Build without this first; set it only if Railway/direct IPs are blocked. | ? (All) | `S` |
| `IMAGE_KIT_PRIVATE_KEY` | ImageKit server-side private key. See [ImageKit](./image-kit.md). | All | `S` |
| `IMAGE_KIT_PUBLIC_KEY` | ImageKit public key. See [ImageKit](./image-kit.md). | All | `C` |
| `IMAGE_KIT_FOLDER_PREFIX` | Optional ImageKit upload folder namespace. See [ImageKit](./image-kit.md). | ? (All) | `S` |
| `IMAGE_KIT_URL_ENDPOINT` | ImageKit URL endpoint. See [ImageKit](./image-kit.md). | All | `C` |
| `LOGGER` | Console logger mode. | ? (All) | `S` |
| `LOG_LEVEL` | Minimum logger level. | ? (All) | `S` |
| `PORT` | HTTP port for the optional non-cron health server. Defaults to `4007` locally. | ? (All) | `S` |
| `REDIS` | Optional fallback BullMQ Redis connection string. Railway previews may use this as a shared Redis reference when `REDIS_URL` is not resolved. | ? (All) | `S` |
| `REDIS_URL` | BullMQ Redis connection string. In Railway, reference the Redis service value. | All | `S` |
| `SCRAPER_AUTMOG_INTERVAL_MINUTES` | Optional Autmog scrape interval used by `cron:run`. Defaults to `60`; the first cron execution after fresh Redis state runs Autmog immediately. | ? (All) | `S` |
| `SCRAPER_AUTMOG_START_DELAY_SECONDS` | Optional delay before the first Autmog scrape for the legacy in-process scheduler. Defaults to `0`; not used by Railway cron. | ? (All) | `S` |
| `SCRAPER_DRY_RUN` | When `true`, processor jobs write DB/queue state but skip image upload/delete mutations. | ? (All) | `S` |
| `SCRAPER_GRIMSMO_FJELL_START_DELAY_SECONDS` | Optional Grimsmo Fjell first-run offset. Defaults to `1800`; Railway cron and the legacy scheduler use it to stagger Fjell around 30 minutes past the hour. | ? (All) | `S` |
| `SCRAPER_GRIMSMO_INTERVAL_MINUTES` | Optional Grimsmo scrape interval for Saga, Rask, Fjell, and Norseman. Defaults to `60`. | ? (All) | `S` |
| `SCRAPER_GRIMSMO_NORSEMAN_START_DELAY_SECONDS` | Optional Grimsmo Norseman first-run offset. Defaults to `2700`; Railway cron and the legacy scheduler use it to stagger Norseman around 45 minutes past the hour. | ? (All) | `S` |
| `SCRAPER_GRIMSMO_RASK_START_DELAY_SECONDS` | Optional Grimsmo Rask first-run offset. Defaults to `900`; Railway cron and the legacy scheduler use it to stagger Rask around 15 minutes past the hour. | ? (All) | `S` |
| `SCRAPER_GRIMSMO_SAGA_START_DELAY_SECONDS` | Optional Grimsmo Saga first-run offset. Defaults to `0`; Railway cron and the legacy scheduler use it to run Saga at the top of the hour. | ? (All) | `S` |
| `SCRAPER_IMAGE_BATCH_SIZE` | Optional cap for image jobs processed per processor run. Recommended initial value: `25`. | ? (All) | `S` |
| `SCRAPER_ITEM_BATCH_SIZE` | Optional cap for item jobs processed per processor run. Recommended initial value: `100`. | ? (All) | `S` |
| `SCRAPER_QUEUE_PROCESSOR_INTERVAL_MINUTES` | Optional queue processor interval for the legacy in-process scheduler. Railway cron uses the `*/15 * * * *` schedule in `railway.json`. | ? (All) | `S` |
| `SCRAPER_QUEUE_PROCESSOR_START_DELAY_SECONDS` | Optional delay before the first queue processor run for the legacy in-process scheduler. Defaults to `30`; not used by Railway cron. | ? (All) | `S` |
| `SCRAPER_QUEUE_CONCURRENCY` | Optional BullMQ worker concurrency cap. Recommended initial value: `3`. | ? (All) | `S` |
| `SCRAPER_SCHEDULER_ENABLED` | Enables the legacy in-process scrape and processor schedules for the non-cron server command. Railway cron does not use this. | ? (All) | `S` |

Legend: `S` = server-only. `C` = client-visible.

See [railway.md](./railway.md) for Railway service and cron setup.

For Railway preview and production, prefer a Railway service reference rather
than storing the Redis URL in Infisical. If the Redis service is named
`scraper-queue`, set this on the scraper service in Railway:

```dotenv
REDIS_URL=${{scraper-queue.REDIS_PUBLIC_URL}}
```

If Railway preview environments provide Redis through a shared variable instead,
the scraper also accepts `REDIS` as a fallback. `REDIS_URL` remains the canonical
application variable and is preferred when it resolves to a valid Redis URL.

For local development, use Docker/OrbStack and `pnpm dev:scraper`; see
[docker.md](./docker.md).

For local manual source runs, use the root scraper commands. They start or reuse
the local Docker/OrbStack Redis container and inject `/apps/scraper` values from
Infisical:

```sh
pnpm scraper:scrape -- autmog
pnpm scraper:process
pnpm scraper:process:dead-letter
```

### Cloudflare Deploy Tools: `/tools/cloudflare`

Cloudflare deployment credentials are separate from API runtime secrets.

| Variable | What it is for | Required | Important notes |
| --- | --- | --- | --- |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account selected by Wrangler. | All | `S` |
| `CLOUDFLARE_API_TOKEN` | Wrangler authentication for deploys. | All | `S` |

Legend: `S` = server-only. `C` = client-visible.

See [cloudflare-api.md](./cloudflare-api.md) for deployment flow details.

### Mobile Release Tools: `/tools/fastlane`

Fastlane mobile release credentials are separate from mobile app runtime values.
See [mobile-release-fastlane.md](./mobile-release-fastlane.md) for the full
release flow.

| Variable | What it is for | Required | Important notes |
| --- | --- | --- | --- |
| `ANDROID_KEY_ALIAS` | Android release signing key alias. | Prod | `S` |
| `ANDROID_KEY_PASSWORD` | Android release signing key password. | Prod | `S` |
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded Android release keystore. | Prod | `S` |
| `ANDROID_KEYSTORE_PASSWORD` | Android release keystore password. | Prod | `S` |
| `APPLE_TEAM_ID` | Apple Developer Team ID used by fastlane. | Prod | `S` |
| `ASC_ISSUER_ID` | App Store Connect API issuer ID. | Prod | `S` |
| `ASC_KEY_ID` | App Store Connect API key ID. | Prod | `S` |
| `ASC_KEY_P8_BASE64` | Base64-encoded App Store Connect API private key. | Prod | `S` |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON_BASE64` | Base64-encoded Google Play service account JSON. | Prod | `S` |
| `GOOGLE_PLAY_TRACK` | Google Play upload track. | Prod | `S` |
| `MATCH_GIT_BASIC_AUTHORIZATION` | Optional auth header for the match signing repo. | ? (Prod) | `S` |
| `MATCH_GIT_URL` | Private fastlane match signing repository URL. | Prod | `S` |
| `MATCH_PASSWORD` | Encryption password for fastlane match signing assets. | Prod | `S` |

Legend: `S` = server-only. `C` = client-visible.

### Mobile App: `/apps/mobile`

`apps/mobile` validates JavaScript-visible Expo values. Values available to app
JavaScript must use Expo's `EXPO_PUBLIC_` prefix.

| Variable | What it is for | Required | Important notes |
| --- | --- | --- | --- |
| `API_URL` | API origin aliased to `EXPO_PUBLIC_API_URL` by the Infisical runner. | ? (All) | `C` |
| `EXPO_PUBLIC_API_URL` | API origin used by mobile requests and client log proxy posts. | ? (All) | `C` |
| `CLERK_PUBLISHABLE_KEY` | Clerk mobile SDK publishable key. The Infisical runner aliases this to `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` before Expo commands run. | All | `C` |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Expo-visible Clerk publishable key consumed by app JavaScript. Prefer setting `CLERK_PUBLISHABLE_KEY` in Infisical and letting the runner alias it. | All | `C` |
| `EXPO_PUBLIC_LOG_PROXY_CLIENT_KEY` | Client key sent to the API log proxy. | ? (All) | `C` |

Legend: `S` = server-only. `C` = client-visible.

Mobile development, test, and default build commands load these values from
Infisical environment `dev` at `/apps/mobile`. Preview Expo builds load
Infisical environment `preview` at `/apps/mobile`, and production Expo builds
load Infisical environment `prod` at `/apps/mobile`.

Server-only values such as `DATABASE_URL` and `CLERK_SECRET_KEY` should stay
behind `apps/api` or web server code.

### Database Commands

`packages/database` validates `DATABASE_URL` when it is present in
`drizzle.config.ts`. The variable is optional at config load time so commands
that do not need database credentials can still run.

| Variable | What it is for | Required | Important notes |
| --- | --- | --- | --- |
| `DATABASE_URL`[^5] | Drizzle migration and database command connection string. | All | `S` |
| `DATABASE_URL_<INITIALS>` | Optional personal dev database override stored only in Infisical environment `dev` at `/local/database`. Infisical-wrapped database, API, web, and scraper commands check this shared path regardless of their app secret path. For example, `DATABASE_URL_RA` overrides `DATABASE_URL` when the runner resolves the suffix `RA`. | ? (Dev) | `S` |
| `INFISICAL_DATABASE_URL_SUFFIX` | Optional local suffix override for personal database URLs. For example, set `INFISICAL_DATABASE_URL_SUFFIX=RA` to make the runner look for `DATABASE_URL_RA`. If omitted, the runner tries `git config user.initials`, then initials derived from `git config user.name`. | ? (Dev) | `S` |

Legend: `S` = server-only. `C` = client-visible.

The personal database override is applied after Infisical injects secrets and
before the wrapped command starts. If the suffixed variable is missing, the
command keeps using `DATABASE_URL`. When an override is used, the runner prints
the variable name and Infisical path, for example `DATABASE_URL_RA` from
`/local/database`, without printing the secret value. Do not store
`DATABASE_URL_<INITIALS>` in app paths such as `/apps/api`, `/apps/web`, or
`/apps/scraper`; the runner does not check those paths for personal database
overrides. When the suffixed variable is missing, the runner prints the
Infisical path it checked and that it is falling back to `DATABASE_URL`.

### FigJam / Figma Agent Bridge: `/local/figma`

Codex and Claude use the FigJam bridge through the dedicated Figma/FigJam
integration account.

| Variable | What it is for | Required | Important notes |
| --- | --- | --- | --- |
| `FIGMA_ACCESS_TOKEN` | Personal Access Token for the dedicated integration account. | Dev | `S` |
| `FIGMA_FIGJAM_ALLOWED_FILE_KEYS` | Comma-separated allowlist of FigJam/Figma file keys. | Dev | `S` |
| `FIGMA_FIGJAM_FILE_KEY` | Primary FigJam planning board file key. | Dev | `S` |
| `GIT_BRANCH` | Payload metadata. | ? (Dev) | `S` |
| `GIT_COMMIT` | Payload metadata. | ? (Dev) | `S` |

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

GitHub repository configuration is stored in Infisical Production at
`/tools/github/secrets` and synced to GitHub repository secrets. GitHub
repository variables are not used because Infisical syncs to secrets only.

These secrets configure deploy automation, PR comments, Neon branch management,
Vercel branch environment variables, Railway preview services, and GitHub
Discord notifications.

| Secret | What it is for | Required | Important notes |
| --- | --- | --- | --- |
| `FIELD_LOG_API_PREVIEW_APP_CLIENT_ID` | GitHub App client ID used for API preview comments. | Stg | `S` |
| `FIELD_LOG_API_PREVIEW_APP_PRIVATE_KEY` | Private key for the API preview comment GitHub App. | Stg | `S` |
| `FIELD_LOG_DB_PREVIEW_APP_CLIENT_ID` | GitHub App client ID used for DB preview comments. | Stg | `S` |
| `FIELD_LOG_DB_PREVIEW_APP_PRIVATE_KEY` | Private key for the DB preview comment GitHub App. | Stg | `S` |
| `INFISICAL_CLOUDFLARE_IDENTITY_ID` | Infisical OIDC identity for Cloudflare/API deploy secrets. | Stg, Prod | `S` |
| `INFISICAL_DISCORD_NOTIFIER_IDENTITY_ID` | Infisical OIDC identity for Discord webhook delivery. | All | `S` |
| `INFISICAL_DOMAIN` | Infisical API base URL. | ? (All) | `S` |
| `INFISICAL_ENV_SLUG` | Infisical environment slug. | ? (All) | `S` |
| `INFISICAL_LOGGER_IDENTITY_ID` | Infisical OIDC identity for live logger tests. | Stg | `S` |
| `INFISICAL_OIDC_AUDIENCE` | OIDC audience for Infisical auth. | ? (All) | `S` |
| `INFISICAL_PROJECT_SLUG` | Infisical project selected by GitHub workflows. | All | `S` |
| `NEON_API_KEY` | Authenticates Neon API calls for branch and connection URI management. | Stg, Prod | `S` |
| `NEON_DATABASE_NAME` | Neon `PGDATABASE` value used for connection URI lookup. | Stg, Prod | `S` |
| `NEON_DATABASE_USER` | Neon `PGUSER` value used for connection URI lookup. | Stg, Prod | `S` |
| `NEON_PROJECT_ID` | Neon project managed by DB-aware workflows. | Stg, Prod | `S` |
| `RAILWAY_API_TOKEN` | Authenticates Railway CLI calls for scraper preview service variables. | Stg | `S` |
| `RAILWAY_PROJECT_ID` | Railway project that owns scraper preview environments. | Stg | `S` |
| `VERCEL_PROJECT_ID` | Vercel project ID for the web app. | Stg, Prod | `S` |
| `VERCEL_TEAM_ID` | Exact Vercel Team ID, `team_...`, passed as `teamId` to REST API calls and as `VERCEL_ORG_ID` to Vercel CLI release deploys. | Stg, Prod | `S` |
| `VERCEL_TOKEN` | Authenticates Vercel REST API calls for Preview env vars, deployment lookup, and CLI production deploys. | Stg, Prod | `S` |

Legend: `S` = server-only. `C` = client-visible.

### Create `VERCEL_TOKEN`

1. Open Vercel account settings and go to the Access Tokens area.[^6]
2. Create a token for the team that owns the web project.
3. Copy the token once and save it in Infisical as `VERCEL_TOKEN`.
4. Keep `VERCEL_TEAM_ID` and `VERCEL_PROJECT_ID` in the same Infisical path.
   Use the exact `team_...` ID, not the team slug/name or surrounding label text.
5. Make sure `VERCEL_PROJECT_ID` belongs to `VERCEL_TEAM_ID`; a token for a
   different account or team will receive `401` or `403` from the Vercel API.

GitHub workflows use the token as a bearer token against `https://api.vercel.com`.

### Create `NEON_API_KEY`

1. Open the Neon Console for the organization that owns the project.[^7]
2. Prefer `Settings > API keys > Create new > Project-scoped` and select the
   project used by `NEON_PROJECT_ID`.
3. If project-scoped keys are not suitable, use an organization API key created
   by an organization admin.
4. Copy the token immediately; Neon shows API key tokens only once.
5. Save the token in Infisical as `NEON_API_KEY`.
6. Keep `NEON_PROJECT_ID`, `NEON_DATABASE_NAME`, and `NEON_DATABASE_USER` as
   GitHub secrets synced from Infisical.

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
| `RAILWAY_ENVIRONMENT_NAME` | Railway environment name for the deployed scraper service. | Railway | `S` |
| `RAILWAY_PROJECT_ID` | Railway project identifier for the deployed scraper service. | Railway | `S` |
| `RAILWAY_SERVICE_ID` | Railway service identifier for the deployed scraper service. | Railway | `S` |
| `RAILWAY_SERVICE_NAME` | Railway service name for the deployed scraper service. | Railway | `S` |
| `VERCEL_ENV` | Vercel deployment environment. | Vercel | `S` |
| `VERCEL_GIT_PULL_REQUEST_ID` | Pull request number for Vercel Preview builds. | Vercel | `S` |
| `VERCEL_PROJECT_PRODUCTION_URL`[^8] | Vercel production domain. | Vercel | `S` |

Legend: `S` = server-only. `C` = client-visible.

## Token And Key Permissions

Use least-privilege credentials where the provider supports scoping.

### `FIELD_LOG_API_PREVIEW_APP_PRIVATE_KEY`

- Repository permissions[^9]:
  - Issues: Read and Write.
  - Pull requests: Read and Write.

### `FIELD_LOG_DB_PREVIEW_APP_PRIVATE_KEY`

- Repository permissions[^9]:
  - Issues: Read and Write.
  - Pull requests: Read and Write.

### `NEON_API_KEY`

- Neon project scope[^7]:
  - Prefer a project-scoped organization API key for `NEON_PROJECT_ID`.
  - Must allow listing, creating, deleting, and restoring branches.
  - Must allow pooled connection URI lookup for `NEON_DATABASE_NAME` and
    `NEON_DATABASE_USER`.

### `VERCEL_TOKEN`

- Vercel project access[^6]:
  - Must be created for the team in `VERCEL_TEAM_ID`.
  - Must access the project in `VERCEL_PROJECT_ID`.
  - Must allow project environment variable create/list/delete for Preview.
  - Must allow deployment lookup for the web project.

### `CLOUDFLARE_API_TOKEN`

- Account permissions[^10]:
  - Workers Scripts: Edit.
  - Account Settings: Read.
- Account scope:
  - Limit to the account that owns `field-log.app`.

### `FIGMA_ACCESS_TOKEN`

- Figma access[^11]:
  - Use the dedicated integration account.
  - Token must read the FigJam/Figma files in `FIGMA_FIGJAM_ALLOWED_FILE_KEYS`.

### `AXIOM_TOKEN`

- Axiom access[^12]:
  - Runtime logging tokens need ingest access to the configured dataset.
  - The live logger test token also needs query access for its testing dataset.

[^1]: Vercel Preview uses the shared staging database by default.
    DB-changing PRs get a branch-specific `DATABASE_URL` override.
[^2]: The web build aliases `API_URL` to `VITE_API_URL` and
    `LOG_PROXY_CLIENT_KEY` to `VITE_LOG_PROXY_CLIENT_KEY` when the `VITE_*`
    names are absent. The web and mobile loggers append `/api/v0/logs` to the
    API URL.
[^3]: `Stg` here means Vercel Preview. This value is not
    used by the shared staging web deploy.
[^4]: GitHub deploy workflows resolve branch-specific Neon URLs
    and pass them explicitly to Wrangler.
[^5]: `pnpm db:migrate` loads this through the Infisical
    runner. CI preview, staging, and production migrations pass explicit Neon
    branch URLs.
[^6]: Vercel REST API docs say Vercel Access Tokens authenticate API
    requests via `Authorization: Bearer <TOKEN>` and are created in account
    settings: <https://vercel.com/docs/rest-api#authentication>.
[^7]: Neon API key docs describe personal, organization, and
    project-scoped keys, console creation paths, and the one-time token display:
    <https://neon.com/docs/manage/api-keys>.
[^8]: Used as the canonical deployed origin when `SITE_URL`
    is absent.
[^9]: GitHub documents GitHub App permissions here:
    <https://docs.github.com/en/apps/creating-github-apps/setting-up-a-github-app/choosing-permissions-for-a-github-app>.
[^10]: Cloudflare documents API token creation here:
    <https://developers.cloudflare.com/fundamentals/api/get-started/create-token/>.
[^11]: Figma documents personal access tokens here:
    <https://help.figma.com/hc/en-us/articles/8085703771159-Manage-personal-access-tokens>.
[^12]: Axiom documents API token setup here:
    <https://axiom.co/docs/reference/tokens>.
