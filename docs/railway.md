# Railway

`apps/scraper` runs as one TypeScript cron service on Railway. Railway starts the
service on a cron schedule, the scraper runs due source and queue jobs, then the
process exits. The scraper is separate from the Cloudflare API Worker because
scraper runs may exceed Worker Cron wall-time limits.

Railway hosts the scheduled scraper service and Redis. Postgres remains the
durable source of truth for scraped rows, image state, run records, and version
history. Redis is the BullMQ work queue and stores lightweight cron state, such
as the last successful source run time.

## Services

Create only the `apps/scraper` service from this repository. Railway may
detect other deployable workspace apps during import, but they should be ignored
or skipped for this Railway project.

Use the root Railway config:

| Service | Config file path |
| --- | --- |
| `field-log` / `apps-scraper` | `/railway.json` |

The config pins the build and start commands to `@app/scraper`, configures the
Railway cron schedule, and limits automatic deploy triggers to `apps/scraper`,
shared packages, and root workspace config files.

Create these Railway services/resources:

| Service | Type | Command | Schedule |
| --- | --- | --- | --- |
| `field-log` / `apps-scraper` | Cron service | `pnpm --filter @app/scraper run cron:run` | Railway cron `*/15 * * * *`; runs due source jobs and queue processing, then exits. |
| `redis` | Redis database | Railway Redis template | Always available to the scraper service. |

Do not create one Railway service per scraped site. Adding Autmog, Grimsmo, FH,
NTI, or future sources should add source definitions and handlers in
`apps/scraper`, not new Railway services.

## Health Check

The scraper still exposes this endpoint when started as a long-running server:

```txt
GET /health
```

The response body is:

```json
{
  "app": "scraper",
  "ok": true
}
```

Do not configure a Railway healthcheck for the cron service. Railway cron
deployments should run their start command to completion and exit. `/health` is
only for the non-cron server command.

## Schedule Behavior

The scraper service uses Railway cron instead of in-process schedules. Railway
runs the service every 15 minutes with:

```cron
*/15 * * * *
```

Each cron execution runs `cron:run`. The queue processor runs every execution.
Autmog runs when its configured interval has elapsed; by default that is hourly.
The first cron execution after a fresh Redis state runs Autmog immediately.

`railway.json` sets `deploy.cronSchedule`, so the value applies through
Railway's config-as-code path. Railway's docs note that config-as-code values do
not backfill the Settings form; verify the cron value in the deployment details,
or set the same `*/15 * * * *` value manually in the Railway Settings page if
you want the form itself populated.

Railway cron services must exit after the job finishes. If a previous cron
execution is still active when the next schedule is due, Railway skips the new
execution.

Source due state is stored in Redis. Keep handlers idempotent anyway; BullMQ
delivery is at-least-once, and clearing Redis can cause a source producer to run
earlier than its usual interval.

Future source schedules should be added in `apps/scraper` and staggered in code
or configuration inside the `cron:run` command. Do not add one Railway service
per scraped site.

Manual source runs use source keys. For local development, use the root command
so local Docker/OrbStack Redis is started and `/apps/scraper` secrets are
injected from Infisical:

```sh
pnpm scraper:scrape -- autmog
```

To simulate one Railway cron execution locally, run:

```sh
pnpm scraper:cron
```

This starts or reuses local Docker/OrbStack Redis, injects `/apps/scraper`
secrets, runs due source jobs and queue processing once, then exits. It does not
start a local timer.

Inside a Railway shell, the service already has its environment variables, so
the package command can be used directly:

```sh
pnpm --filter @app/scraper run scrape -- autmog
```

Implemented source keys are `autmog`, `grimsmo-saga`, `grimsmo-rask`,
`grimsmo-fjell`, and `grimsmo-norseman`. The Grimsmo sources fetch unprefixed
`https://grimsmoknives.com` Shopify collection URLs so prices normalize as USD.
The older `pnpm scraper:scrape:autmog` and
`pnpm --filter @app/scraper run scrape:autmog` aliases remain available.

## Queue Design

Use BullMQ with Railway Redis.

Queues:

- `scraper-items`: normalized item work for pens, knives, or future product
  types.
- `scraper-images`: image upload/delete work.

Producer jobs fetch upstream data, normalize enough to identify each item, and
enqueue item jobs. They do not upload images directly.

The processor job drains queued work, upserts Postgres tables, writes version
snapshots, enqueues or processes image jobs, uploads images, and handles pending
deletes.

Use deterministic job IDs so retries and duplicate scrape runs are idempotent:

```txt
autmog--pen--<sourceProductId>--<detailsHash>
autmog--image--upload--<imageId>--<sourceHash>
grimsmo-saga--pen-variation--<sourceHandle>--<detailsHash>
grimsmo-rask--knife-variation--<sourceHandle>--<detailsHash>
grimsmo-fjell--knife-variation--<sourceHandle>--<detailsHash>
grimsmo-norseman--knife-variation--<sourceHandle>--<detailsHash>
```

Configure retries with exponential backoff and conservative concurrency. Treat
BullMQ delivery as at-least-once; every handler must be safe to process more
than once.

Recommended initial processor tuning:

| Variable | Initial value | Notes |
| --- | --- | --- |
| `SCRAPER_ITEM_BATCH_SIZE` | `100` | Enough to drain current Autmog in a small number of processor runs without making each run too large. |
| `SCRAPER_IMAGE_BATCH_SIZE` | `25` | Keeps image/network work bounded; increase after observing runtime and failure rate. |
| `SCRAPER_QUEUE_CONCURRENCY` | `3` | Conservative starting point for DB, Redis, image storage, and upstream friendliness. |

Tune these from production logs after the first successful runs. Prefer raising
batch sizes before raising concurrency.

## Redis

Create Redis directly in Railway using the Railway Redis database/template.
`apps/scraper` should not provision Redis at runtime. Reference Redis from the
scraper service through `REDIS_URL`.

Prefer Railway private networking/service variables for preview and production
service-to-service access. If the Redis service is named `scraper-queue`, set
this variable on the scraper service:

```dotenv
REDIS_URL=${{scraper-queue.REDIS_URL}}
```

Use the actual Railway Redis service name. Avoid copying Railway Redis URLs into
Infisical unless the scraper is connecting to a non-Railway Redis provider.
Local development uses Docker/OrbStack through `pnpm dev:scraper`; see
[docker.md](./docker.md).

## Environment Variables

Runtime variables for `apps/scraper` are documented in
[environment-variables.md](./environment-variables.md).

Required groups:

- Database: `DATABASE_URL`
- Queue: `REDIS_URL`
- ImageKit: see [ImageKit](./image-kit.md) for endpoint, upload path, and
  preview namespace rules
- Logger: `AXIOM_TOKEN`, `AXIOM_DATASET`, optional `AXIOM_EDGE_DOMAIN`,
  `LOG_LEVEL`, and `LOGGER`
- Grimsmo proxying: try direct fetches without `GRIMSMO_PROXY_URL` first; add
  `GRIMSMO_PROXY_URL` only if Railway/direct IP fetches are blocked

Grimsmo producers run hourly and are staggered by default: Saga at the top of
the hour, Rask around `:15`, Fjell around `:30`, and Norseman around `:45`.
Railway still invokes the single cron service every 15 minutes; the scraper
checks Redis state and runs only due producers.

## Preview Database Sync

The Railway scraper preview service must use the same Neon branch selected for
the API and web previews. Branch code running against the shared staging
database can fail with misleading type errors when the PR contains database
schema changes.

The API Deploy workflow configures this handoff after it prepares the Neon
preview database:

- DB-changing PRs use the isolated `preview-pr-<number>` branch after committed
  migrations are applied.
- Non-DB-changing PRs use the shared `staging` branch.
- The selected `DATABASE_URL` is upserted into the Railway scraper preview
  service through the Railway CLI.

GitHub Actions requires:

| Name | Type | Purpose |
| --- | --- | --- |
| `RAILWAY_API_TOKEN` | Secret | Railway account or workspace token that can edit service variables in PR environments. |
| `RAILWAY_PROJECT_ID` | Variable | Railway project ID that owns the scraper PR environments. |

The workflow upserts `DATABASE_URL` into the scraper service variables in the
Railway preview service named `field-log (preview)` in the Railway environment
named `field-log-pr-<pull-request-number>`. For example, PR 53 uses
`field-log-pr-53`.

Keep `REDIS_URL` as a Railway service reference such as
`${{scraper-queue.REDIS_URL}}`; only the external Neon `DATABASE_URL` is synced
from the preview database workflow.

## Deployment Notes

- Keep one Railway service for `apps/scraper`.
- Run the scheduled service with `pnpm --filter @app/scraper run cron:run`.
- Set the Railway cron schedule to `*/15 * * * *`.
- Do not configure a Railway healthcheck for the cron service.
- Set `DATABASE_URL` and `REDIS_URL` before enabling the cron service; cron
  executions validate job dependencies before running.
- Do not rely on Redis for historical state. Persist current state and
  idempotency markers in Postgres.
- Make the processor safe to stop mid-run. Pending queue jobs and Postgres image
  statuses should let the next run resume.
- Keep concurrency low by default, then tune from logs after production runs.
