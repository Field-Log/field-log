# Cloudflare API Deployment

`apps/api` runs on Cloudflare Workers in production, staging, PR previews, and
local API development. Local development uses `wrangler dev` by default so
fetch handling, Worker bindings, and scheduled events are exercised in the same
runtime family as deploys.

Reference docs:

- Cloudflare Wrangler commands:
  <https://developers.cloudflare.com/workers/wrangler/commands/>
- Cloudflare Wrangler system environment variables:
  <https://developers.cloudflare.com/workers/wrangler/system-environment-variables/>
- Infisical Cloudflare Connection:
  <https://infisical.com/docs/integrations/app-connections/cloudflare>
- Infisical Cloudflare Workers Sync:
  <https://infisical.com/docs/integrations/secret-syncs/cloudflare-workers>

## Cloudflare Services

Configure these Cloudflare services:

- Workers: hosts the API Worker scripts.
- Cron Triggers: invokes the hourly API scheduled handler.
- Custom Domains: routes owned hostnames to the production and staging Workers.
- Workers Preview URLs: hosts per-PR preview aliases for `field-log-api-preview`.
- Worker Secrets: receives API runtime secrets from Infisical Cloudflare Workers
  Sync.

Cloudflare must manage the `field-log.app` DNS zone before custom domains can
serve `api.field-log.app` or `api.staging.field-log.app`.

## Worker Names And Domains

Production:

- Worker: `field-log-api`
- Domain: `api.field-log.app`
- Infisical app secrets: environment `prod`, path `/apps/api`
- Infisical deploy credentials: environment `prod`, path `/tools/cloudflare`

Staging:

- Worker: `field-log-api-staging`
- Domain: `api.staging.field-log.app`
- Infisical app secrets: environment `prod`, path `/apps/api`
- Manual deploy credentials: environment `dev`, path `/tools/cloudflare`

Previews:

- Worker: `field-log-api-preview`
- Domain: Cloudflare preview URL with a PR alias
- Infisical app secrets: environment `preview`, path `/apps/api`
- Infisical deploy credentials: environment `preview`, path `/tools/cloudflare`

Preview deployments use Cloudflare preview URLs rather than
`api.preview.field-log.app`. A PR alias URL uses this shape:

```txt
https://pr-123-field-log-api-preview.<account-subdomain>.workers.dev
```

## Wrangler Configuration

The Worker config lives at `apps/api/wrangler.jsonc`.

Important settings:

- `name`: `field-log-api`
- `main`: `src/worker.ts`
- `compatibility_flags`: includes `nodejs_compat` because workspace
  dependencies currently import Node built-ins.
- `workers_dev`: disabled for production and staging.
- `preview_urls`: enabled so PR preview aliases can be used.
- `env.preview.routes`: empty so preview uploads do not inherit or reassign
  the production custom domain.
- `triggers.crons`: `0 * * * *`, hourly at minute zero UTC.
- top-level `vars.APP_ENV`: `production`
- `env.preview.vars.APP_ENV`: `preview`
- `env.staging.vars.APP_ENV`: `staging`

Local `wrangler dev` overrides `APP_ENV` to `development` from the package
script with `--var APP_ENV:development`.

## Local Development

Default API development uses Wrangler:

```sh
pnpm --filter @app/api dev
```

From `apps/api`, that command runs:

```sh
infisical run --env=dev --path=/apps/api -- \
  pnpm dlx wrangler dev \
    --config wrangler.jsonc \
    --port 4006 \
    --test-scheduled \
    --var APP_ENV:development
```

Use `http://localhost:4006` for the local API. To invoke the scheduled handler
locally, run the dev server and request:

```sh
curl http://localhost:4006/__scheduled
```

The old Node Hono server is still available for non-Worker debugging:

```sh
pnpm --filter @app/api dev:node
```

## API Runtime Secrets

Use `/apps/api` as the single API runtime secret path in each Infisical
environment.

Development (`dev`):

```dotenv
DATABASE_URL=
AXIOM_TOKEN=
AXIOM_DATASET=development
AXIOM_EDGE_DOMAIN=
LOG_LEVEL=debug
LOGGER=compact
LOG_PROXY_CLIENT_KEY=
MOBILE_ANDROID_STORE_URL=
MOBILE_IOS_STORE_URL=
MOBILE_LATEST_VERSION=
MOBILE_MIN_SUPPORTED_VERSION=
MOBILE_UPDATE_SEVERITY=none
```

Preview (`preview`):

```dotenv
DATABASE_URL=
AXIOM_TOKEN=
AXIOM_DATASET=development
AXIOM_EDGE_DOMAIN=
LOG_LEVEL=debug
LOGGER=
LOG_PROXY_CLIENT_KEY=
MOBILE_ANDROID_STORE_URL=
MOBILE_IOS_STORE_URL=
MOBILE_LATEST_VERSION=
MOBILE_MIN_SUPPORTED_VERSION=
MOBILE_UPDATE_SEVERITY=none
```

Production (`prod`), used by production and staging for now:

```dotenv
DATABASE_URL=
AXIOM_TOKEN=
AXIOM_DATASET=production
AXIOM_EDGE_DOMAIN=
LOG_LEVEL=info
LOGGER=
LOG_PROXY_CLIENT_KEY=
MOBILE_ANDROID_STORE_URL=
MOBILE_IOS_STORE_URL=
MOBILE_LATEST_VERSION=
MOBILE_MIN_SUPPORTED_VERSION=
MOBILE_UPDATE_SEVERITY=none
```

Do not store `APP_ENV` in `/apps/api` for Worker deploys. Wrangler owns it as a
non-secret variable.

## Cloudflare Initial Setup

1. Confirm the `field-log.app` zone exists in Cloudflare and is active.
2. Create the Worker scripts once by deploying them or by letting the first
   Wrangler deploy create them:

   ```sh
   pnpm deploy
   pnpm deploy:staging
   pnpm deploy:preview -- --preview-alias pr-smoke
   ```

3. In Cloudflare Dashboard, confirm the Workers appear under
   `Workers & Pages`.
4. Confirm custom domain triggers exist:
   - `field-log-api`: `api.field-log.app`
   - `field-log-api-staging`: `api.staging.field-log.app`
5. Confirm preview URLs are enabled for `field-log-api-preview`.

## Infisical Cloudflare Connection

Create a Cloudflare API token for the Infisical App Connection. Infisical's
Cloudflare Workers sync documentation requires these permissions:

- `Account - Workers Scripts - Edit`
- `Account - Account Settings - Read`

In Cloudflare:

1. Open the Cloudflare Dashboard.
2. Open the user profile menu.
3. Go to `API Tokens`.
4. Create a token with the permissions above, scoped to the Cloudflare account
   that owns `field-log.app`.
5. Copy the token once; Cloudflare will not show it again.
6. Copy the account ID from Account Home.

In Infisical:

1. Open the `Field Log` project.
2. Go to `Integrations`.
3. Open `App Connections`.
4. Add a `Cloudflare` connection.
5. Enter the Cloudflare account ID and API token.
6. Verify the connection.

## Infisical Cloudflare Workers Syncs

Create these Cloudflare Workers Secret Syncs from `/apps/api`:

| Infisical environment | Source path | Destination Worker |
| --- | --- | --- |
| `prod` | `/apps/api` | `field-log-api` |
| `prod` | `/apps/api` | `field-log-api-staging` |
| `preview` | `/apps/api` | `field-log-api-preview` |

Use these sync options:

- Initial sync behavior: overwrite destination secrets.
- Key schema: `{{secretKey}}`.
- Auto-sync: enabled.
- Disable secret deletion: disabled, because Infisical is the source of truth.

After the first sync, manage Worker secrets in Infisical only.

## Deploy Credentials In Infisical

Store Wrangler deploy credentials in `/tools/cloudflare`.

Required keys:

```dotenv
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ACCOUNT_ID=
```

`CLOUDFLARE_API_TOKEN` lets Wrangler deploy without an interactive
`wrangler login`. `CLOUDFLARE_ACCOUNT_ID` selects the Cloudflare account. The
GitHub preview workflow reads the PR preview URL from Wrangler's
`Version Preview Alias URL` output instead of constructing it from a configured
workers.dev subdomain.

Create `/tools/cloudflare` in these Infisical environments:

| Infisical environment | Used by | Values |
| --- | --- | --- |
| `dev` | Local `pnpm deploy`, `pnpm deploy:staging`, and `pnpm deploy:preview` | Cloudflare deploy token, account ID |
| `preview` | GitHub PR preview workflow | Cloudflare deploy token, account ID |
| `prod` | GitHub production workflow on `main` | Cloudflare deploy token, account ID |

The token values can be the same or different across environments. Prefer
separate tokens when you want separate revocation and audit trails for local
development, preview CI, and production CI.

## Manual Deployments

Local manual deploy commands first build `@app/api` and its workspace
dependencies, then load `/tools/cloudflare` from Infisical `dev`. The build
step is required because Wrangler resolves workspace package exports from
`dist/`.

Production:

```sh
pnpm deploy
```

Staging:

```sh
pnpm deploy:staging
```

Preview upload with a PR alias:

```sh
pnpm deploy:preview -- --preview-alias pr-123
```

## GitHub Deployments

The `API Deploy` workflow deploys Workers from GitHub Actions with Infisical
OIDC.

Pull requests:

- Runs for same-repository pull requests on `opened`, `reopened`, and
  `synchronize`.
- Runs only when changes include `apps/api/**`, `packages/**`, workspace config,
  or the workflow itself.
- Detects DB-changing PRs from changes under `packages/database/src/schema/**`,
  `packages/database/drizzle/**`, `packages/database/drizzle.config.ts`,
  `packages/database/package.json`, or `pnpm-lock.yaml`.
- Adds the `db-change` label when DB changes are present and removes it when
  later PR updates no longer contain DB changes.
- Creates an isolated Neon branch named `preview-pr-<number>` only for
  DB-changing PRs. The branch is recreated from `production` on every PR update
  before committed Drizzle migrations are applied.
- Blocks DB-isolated preview creation instead of falling back to `staging` when
  the Neon project is at the configured branch limit and no existing PR branch
  can be reused.
- Removes stale `preview-pr-*` branches and stale branch-specific Vercel
  `DATABASE_URL` overrides when a PR no longer contains DB changes.
- Applies the matching ImageKit preview folder namespace documented in
  [ImageKit](./image-kit.md).
- Builds `@app/api` and its workspace dependencies before running Wrangler.
- Reads Infisical environment `preview`, path `/tools/cloudflare`.
- Does not write Cloudflare Worker runtime secrets. Preview Worker secrets are
  owned by Infisical Secrets Sync.
- Uploads a preview Worker version with alias `pr-<number>`.
- If `field-log-api-preview` does not exist yet, bootstraps it with
  `wrangler deploy --env preview`, then retries the aliased version upload.
- Deploys a preview Worker anchor version after the aliased upload so
  Cloudflare's latest Worker version is deployed while existing preview aliases
  remain available.
- Smoke-tests the preview health endpoint.
- Posts or updates a pull request comment with the preview and health URLs
  using the installed `Field Log API Preview` GitHub App.
- Posts or updates a separate DB preview comment with marker
  `<!-- field-log-db-preview -->` using the installed `Field Log DB Preview`
  GitHub App.
- A separate `API Preview Cleanup` workflow runs for every same-repository
  `closed` pull request without path filters.
- The cleanup workflow marks the preview comments inactive, deletes
  `preview-pr-<number>`, and removes branch-specific Vercel `DATABASE_URL` when
  the pull request closes.

Release tags:

- Runs on pushed `v*` tags created by `pnpm release`.
- Runs committed Drizzle migrations against the Neon `production` branch before
  deploying.
- Builds `@app/api` and its workspace dependencies before running Wrangler.
- Reads Infisical environment `prod`, path `/tools/cloudflare`.
- Does not write Cloudflare Worker runtime secrets. Production Worker secrets
  are owned by Infisical Secrets Sync.
- Deploys `field-log-api` to `api.field-log.app`.
- Smoke-tests `https://api.field-log.app/api/v0/health`.
- Validates `@app/web`, pulls the Vercel production environment, builds with
  `vercel build --prod`, deploys with `vercel deploy --prebuilt --prod`, and
  smoke-tests the resulting production deployment URL.
- Vercel Git deployment gating is documented in [vercel.md](./vercel.md).

Manual `workflow_dispatch` on `main` remains available for operational
recovery, but normal production deploys should come from an annotated `v*` tag.

Configure these values in Infisical Production at `/tools/github/secrets`; they
sync to GitHub repository secrets:

- `FIELD_LOG_API_PREVIEW_APP_CLIENT_ID`
- `FIELD_LOG_DB_PREVIEW_APP_CLIENT_ID`
- `INFISICAL_CLOUDFLARE_IDENTITY_ID`
- `INFISICAL_PROJECT_SLUG`
- `NEON_DATABASE_NAME`
- `NEON_DATABASE_USER`
- `NEON_PROJECT_ID`
- `VERCEL_PROJECT_ID`
- `VERCEL_TEAM_ID`
- optional `INFISICAL_DOMAIN`, defaults to `https://app.infisical.com`
- optional `INFISICAL_OIDC_AUDIENCE`, defaults to
  `https://github.com/{repository_owner}`

- `FIELD_LOG_API_PREVIEW_APP_PRIVATE_KEY`
- `FIELD_LOG_DB_PREVIEW_APP_PRIVATE_KEY`
- `NEON_API_KEY`
- `RAILWAY_API_TOKEN`
- `RAILWAY_PROJECT_ID`
- `RAILWAY_SCRAPER_SERVICE_NAME`
- `VERCEL_TOKEN`

The `Field Log API Preview` GitHub App must be installed on this repository
with these repository permissions:

- `Issues: Read and write`
- `Pull requests: Read and write`

The `Field Log DB Preview` GitHub App needs the same repository permissions.

Pull request comments use GitHub issue comments, but GitHub may accept either
the Issues or Pull requests write permission for pull request comment endpoints.
After changing app permissions, approve the updated installation permissions in
the GitHub App installation settings for `Field-Log/field-log`.

The GitHub App uses its own pull request comment marker. If the workflow
previously commented as `github-actions[bot]`, delete that old comment manually
after the app creates its replacement.

The Infisical identity must read:

- environment `preview`, path `/tools/cloudflare`
- environment `prod`, path `/tools/cloudflare`

Fork pull requests are skipped because GitHub must not expose deployment
credentials to untrusted fork code.

## Vercel Preview Handoff

The API preview workflow comments with the Cloudflare preview URL. It does not
write per-PR `/apps/web` values in Infisical.

Configure the Vercel web project to expose System Environment Variables so
`VERCEL_ENV` and `VERCEL_GIT_PULL_REQUEST_ID` are available during preview
builds.

Store this stable value in the web preview environment:

```dotenv
API_PREVIEW_WORKER_HOST=field-log-api-preview.<account-subdomain>.workers.dev
```

During Vercel PR previews, `apps/web` derives the API URLs from the PR number:

```dotenv
VITE_API_URL=https://pr-123-field-log-api-preview.23242.workers.dev
```

This avoids shared Infisical `preview /apps/web` values that only support one PR
at a time. If a Vercel branch preview was created before the pull request
existed, redeploy that Vercel preview after the pull request exists so
`VERCEL_GIT_PULL_REQUEST_ID` is populated.

For DB-changing PRs, the API deploy workflow also creates or replaces a
branch-specific Vercel Preview `DATABASE_URL` scoped to the PR Git branch. That
override points the web preview server runtime at the matching
`preview-pr-<number>` Neon branch. The workflow also applies the ImageKit
preview folder namespace from [ImageKit](./image-kit.md). When DB changes are
removed or the PR closes, the workflow removes the branch-specific
`DATABASE_URL` so the web preview falls back to the shared Preview
`DATABASE_URL`, which should point at Neon `staging`; PR close also removes the
branch-specific image folder prefix. The Cloudflare preview Worker always uses
the runtime secrets managed by Infisical Secrets Sync; PR-specific database URLs
are not written to Worker secrets by this workflow.

Vercel environment changes apply to new deployments. If the latest Vercel
preview build started before the branch-specific database override was updated,
redeploy the Vercel preview.

## Staging Refresh

The `Staging Refresh` workflow runs on a nightly schedule and by manual
`workflow_dispatch`. It resets Neon `staging` from `production`, runs committed
Drizzle migrations against `staging`, deploys `field-log-api-staging` with an
explicit staging `DATABASE_URL`, and smoke-tests
`https://api.staging.field-log.app/api/v0/health`.

Do not reset staging from production on every PR. The staging branch backs
normal previews and may contain shared non-production data.

## Smoke Tests

Run these checks after production, staging, or preview deploys.

Health:

```sh
curl --fail https://api.field-log.app/api/v0/health
```

Log proxy with a configured client key:

```sh
curl --fail \
  --request POST \
  --header "content-type: application/json" \
  --header "x-log-client-key: $LOG_PROXY_CLIENT_KEY" \
  --data '{"app":"web","environment":"smoke","level":"info","message":"api.smoke.log"}' \
  https://api.field-log.app/api/v0/logs
```

Log proxy rejection when a client key is configured:

```sh
curl --silent --output /dev/null --write-out "%{http_code}\n" \
  --request POST \
  --header "content-type: application/json" \
  --data '{"app":"web","environment":"smoke","level":"info","message":"api.smoke.log"}' \
  https://api.field-log.app/api/v0/logs
```

The unauthenticated log proxy check should return `401` when
`LOG_PROXY_CLIENT_KEY` is configured.

Cron validation:

1. Wait until the next hour boundary after deployment.
2. Query Axiom for `message == "api.cron.hourly"`.
3. Confirm the event has `app == "api"` and the expected `environment`.

## Rollback

Rollback through Cloudflare Workers deployments or versions.

Production:

1. Open Cloudflare Dashboard -> Workers & Pages -> `field-log-api`.
2. Select Deployments or Versions.
3. Promote or roll back to the last known good version.
4. Run the production smoke tests.
5. Check Axiom for new `api.cron.hourly` events after the next hour.

Staging:

1. Open `field-log-api-staging`.
2. Promote or roll back to the last known good version.
3. Run smoke tests against `https://api.staging.field-log.app`.

Preview:

1. Re-upload the last known good commit with the same PR preview alias.
2. Confirm the Vercel preview has System Environment Variables enabled.
3. Retrigger the Vercel preview build if needed so it recomputes the API URL
   from the PR number.
