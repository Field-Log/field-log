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
CLOUDFLARE_WORKERS_SUBDOMAIN=
```

`CLOUDFLARE_API_TOKEN` lets Wrangler deploy without an interactive
`wrangler login`. `CLOUDFLARE_ACCOUNT_ID` selects the Cloudflare account.
`CLOUDFLARE_WORKERS_SUBDOMAIN` is the account workers.dev subdomain, for
example `23242`, and is used to construct PR preview URLs.

Create `/tools/cloudflare` in these Infisical environments:

| Infisical environment | Used by | Values |
| --- | --- | --- |
| `dev` | Local `pnpm deploy`, `pnpm deploy:staging`, and `pnpm deploy:preview` | Cloudflare deploy token, account ID, workers.dev subdomain |
| `preview` | GitHub PR preview workflow | Cloudflare deploy token, account ID, workers.dev subdomain |
| `prod` | GitHub production workflow on `main` | Cloudflare deploy token, account ID, workers.dev subdomain |

The token values can be the same or different across environments. Prefer
separate tokens when you want separate revocation and audit trails for local
development, preview CI, and production CI.

## Manual Deployments

Local manual deploy commands load `/tools/cloudflare` from Infisical `dev`.

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
- Reads Infisical environment `preview`, path `/tools/cloudflare`.
- Uploads a preview Worker version with alias `pr-<number>`.
- Smoke-tests the preview health endpoint.
- Posts or updates a pull request comment with the preview and health URLs.
- Marks the preview comment inactive when the pull request closes.

Merges to `main`:

- Runs on pushes to `main` when API-relevant paths changed.
- Reads Infisical environment `prod`, path `/tools/cloudflare`.
- Deploys `field-log-api` to `api.field-log.app`.
- Smoke-tests `https://api.field-log.app/health`.

Configure these GitHub repository variables:

- `INFISICAL_CLOUDFLARE_IDENTITY_ID`
- `INFISICAL_PROJECT_SLUG`
- optional `INFISICAL_DOMAIN`, defaults to `https://app.infisical.com`
- optional `INFISICAL_OIDC_AUDIENCE`, defaults to
  `https://github.com/{repository_owner}`

The Infisical identity must read:

- environment `preview`, path `/tools/cloudflare`
- environment `prod`, path `/tools/cloudflare`

Fork pull requests are skipped because GitHub must not expose deployment
credentials to untrusted fork code.

## Vercel Preview Handoff

The API preview workflow comments with the Cloudflare preview URL. It does not
write `/apps/web` values in Infisical.

To make a matching Vercel preview consume a PR-specific API URL:

1. Deploy the API preview with alias `pr-123`.
2. Write these values to Infisical environment `preview`, path `/apps/web`:

   ```dotenv
   VITE_API_BASE_URL=https://pr-123-field-log-api-preview.<account-subdomain>.workers.dev
   VITE_LOG_PROXY_URL=https://pr-123-field-log-api-preview.<account-subdomain>.workers.dev/logs
   ```

3. Retrigger the matching Vercel preview deployment.

Automating that handoff requires a write-capable Infisical identity or token
scoped to environment `preview`, path `/apps/web`.

## Smoke Tests

Run these checks after production, staging, or preview deploys.

Health:

```sh
curl --fail https://api.field-log.app/health
```

Service info:

```sh
curl --fail https://api.field-log.app/
```

Log proxy with a configured client key:

```sh
curl --fail \
  --request POST \
  --header "content-type: application/json" \
  --header "x-log-client-key: $LOG_PROXY_CLIENT_KEY" \
  --data '{"app":"web","environment":"smoke","level":"info","message":"api.smoke.log"}' \
  https://api.field-log.app/logs
```

Log proxy rejection when a client key is configured:

```sh
curl --silent --output /dev/null --write-out "%{http_code}\n" \
  --request POST \
  --header "content-type: application/json" \
  --data '{"app":"web","environment":"smoke","level":"info","message":"api.smoke.log"}' \
  https://api.field-log.app/logs
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
2. Update `/apps/web` in Infisical `preview` if the preview URL changes.
3. Retrigger the Vercel preview build if needed.
