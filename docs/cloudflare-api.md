# Cloudflare API Deployment

`apps/api` deploys to Cloudflare Workers. The same Hono routes run in local
Node development and in the Worker runtime.

## Cloudflare Services

Configure these Cloudflare services:

- Workers: hosts the API Worker.
- Cron Triggers: invokes the hourly API scheduled handler.
- Custom Domains: routes owned hostnames to the Worker.
- Worker Secrets: receives production, staging, and preview secrets from
  Infisical Cloudflare Workers Sync.

Cloudflare should own the `field-log.app` zone before configuring custom
domains. The Worker custom domain setup creates the required DNS record and
certificate for each hostname.

## Worker Names And Domains

Production:

- Worker: `field-log-api`
- Domain: `api.field-log.app`
- Infisical environment: `prod`
- Infisical path: `/apps/api`

Staging:

- Worker: `field-log-api-staging`
- Domain: `api.staging.field-log.app`
- Infisical environment: `prod`
- Infisical path: `/apps/api`

Previews:

- Worker: `field-log-api-preview`
- Domain: Cloudflare preview URL with a PR alias
- Infisical environment: `preview`
- Infisical path: `/apps/api`

Preview deployments use Cloudflare preview URLs instead of
`api.preview.field-log.app`. A typical PR alias URL looks like:

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
- `workers_dev`: disabled for stable production and staging deployments.
- `preview_urls`: enabled so PR preview aliases can be used.
- `triggers.crons`: `0 * * * *`, hourly at minute zero UTC.

The required Worker bindings are secrets unless noted:

- `DATABASE_URL`
- `AXIOM_TOKEN`
- `AXIOM_DATASET`
- `AXIOM_EDGE_DOMAIN`, optional
- `LOG_LEVEL`, optional
- `LOGGER`, optional
- `LOG_PROXY_CLIENT_KEY`, optional
- `APP_ENV`, non-secret Wrangler var

`APP_ENV` is set in Wrangler config:

- production: `production`
- staging: `staging`
- preview: `preview`

## Local Development

Node dev remains the default API workflow:

```sh
pnpm --filter @repo/api dev
```

Worker runtime dev is available when validating Cloudflare behavior:

```sh
pnpm --filter @repo/api dev:worker
```

Both commands load API development secrets from Infisical environment `dev` at
path `/apps/api`.

## Infisical Secret Layout

Use `/apps/api` as the single API secret path in each Infisical environment.

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

## Infisical Cloudflare Connection

Create a Cloudflare API token with these permissions:

- `Account - Workers Scripts - Edit`
- `Account - Account Settings - Read`

In Infisical:

1. Go to the project integrations area.
2. Add a Cloudflare App Connection.
3. Enter the Cloudflare account ID and API token.
4. Verify the connection.

## Cloudflare Workers Secret Sync

Create Infisical Cloudflare Workers Syncs from `/apps/api`:

- `prod` -> `field-log-api`
- `prod` -> `field-log-api-staging`
- `preview` -> `field-log-api-preview`

The initial sync should overwrite the destination because Cloudflare has no
source-of-truth secrets. After sync, Worker secrets should only be managed from
Infisical.

Do not store `APP_ENV` in Infisical for these Workers; Wrangler owns it as a
non-secret environment variable.

## Deployments

The API deploy scripts load Wrangler credentials from Infisical environment
`dev` at `/tools/cloudflare`:

```dotenv
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_WORKERS_SUBDOMAIN=
```

Production:

```sh
pnpm run deploy
```

Staging:

```sh
pnpm run deploy:staging
```

Preview upload with a PR alias:

```sh
pnpm run deploy:preview -- --preview-alias pr-123
```

Manual deploy order for PR previews:

1. Deploy or upload the API preview with a unique PR alias.
2. Resolve the Cloudflare preview URL.
3. If the Vercel preview must consume that exact API URL, write the API preview
   URL into Infisical environment `preview`, path
   `/apps/web`.
4. Build or retrigger the matching Vercel preview so it reads the updated
   values.

Use these `/apps/web` preview values:

```dotenv
VITE_API_BASE_URL=https://pr-123-field-log-api-preview.<account-subdomain>.workers.dev
VITE_LOG_PROXY_URL=https://pr-123-field-log-api-preview.<account-subdomain>.workers.dev/logs
```

If Vercel starts before Infisical has the PR-specific URL, retrigger that Vercel
preview deployment after updating Infisical.

The GitHub workflow currently deploys the Worker preview and comments with the
preview URL. It does not write `/apps/web` values in Infisical because the
existing GitHub OIDC setup is read-only. Automating that handoff requires a
write-capable Infisical identity or token scoped to environment `preview`, path
`/apps/web`.

## GitHub Deployments

The `API Deploy` workflow deploys Cloudflare Workers from GitHub Actions.

Pull requests:

- Runs for same-repository pull requests on `opened`, `reopened`, and
  `synchronize`.
- Runs only when changes include `apps/api/**`, `packages/**`, workspace config,
  or the workflow itself.
- Uploads a preview Worker version with alias `pr-<number>`.
- Posts or updates a pull request comment with the preview and health URLs.
- Marks the preview comment inactive when the pull request closes.

Merges to `main`:

- Runs on pushes to `main` when API-relevant paths changed.
- Deploys the top-level production Worker environment to `api.field-log.app`.
- Smoke-tests `https://api.field-log.app/health`.

Configure these GitHub repository variables:

- `INFISICAL_CLOUDFLARE_IDENTITY_ID`
- `INFISICAL_PROJECT_SLUG`
- optional `INFISICAL_DOMAIN`, defaults to `https://app.infisical.com`
- optional `INFISICAL_OIDC_AUDIENCE`, defaults to
  `https://github.com/{repository_owner}`

The Infisical Cloudflare identity must be allowed to read environment `dev`,
path `/tools/cloudflare`.

Fork pull requests are skipped because GitHub must not expose deployment
credentials to untrusted fork code.

## Smoke Tests

Run these checks after every production, staging, or preview deploy.

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
