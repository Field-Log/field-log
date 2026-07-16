# Railway

`apps/scraper` runs as one TypeScript service on Railway. The service exposes a
health endpoint, owns source scrape schedules in process, and uses BullMQ/Redis
for item and image work. The scraper is separate from the Cloudflare API Worker
because scraper runs may exceed Worker Cron wall-time limits.

Railway hosts the long-running scraper service and Redis. Postgres remains the
durable source of truth for scraped rows, image state, run records, and version
history. Redis is the BullMQ work queue and the scheduler lock store.

## Services

Create only the `apps/scraper` service from this repository. Railway may
detect other deployable workspace apps during import, but they should be ignored
or skipped for this Railway project.

Use the root Railway config:

| Service | Config file path |
| --- | --- |
| `field-log` / `apps-scraper` | `/railway.json` |

The config pins the build and start commands to `@app/scraper`, sets the health
check, and limits automatic deploy triggers to `apps/scraper`, shared packages,
and root workspace config files.

Create these Railway services/resources:

| Service | Type | Command | Schedule |
| --- | --- | --- | --- |
| `field-log` / `apps-scraper` | Web service | `pnpm --filter @app/scraper run start:scheduled` | Always on; runs `/health`, source schedules, and queue processing. |
| `redis` | Redis database | Railway Redis template | Always available to the scraper service. |

Do not create one Railway service per scraped site. Adding Autmog, Grimsmo, FH,
NTI, or future sources should add source definitions and handlers in
`apps/scraper`, not new Railway services.

## Health Check

Stage 1 exposes:

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

Use `/health` as the Railway healthcheck path for the scraper service.

## Schedule Behavior

The scraper service uses in-process schedules instead of Railway cron services.
Autmog runs hourly by default, starting immediately after the service boots. The
queue processor runs every 15 minutes by default, starting 30 seconds after boot.

Schedules are guarded with Redis locks so a future multi-replica deployment does
not run duplicate source fetches or processors at the same time. Keep handlers
idempotent anyway; BullMQ delivery is at-least-once.

Future source schedules should be added in `apps/scraper` and staggered in code
or configuration. For example, Grimsmo Saga can run on the hour while knife
sources run at offset minutes.

## Queue Design

Use BullMQ with Railway Redis.

Queues:

- `scraper-items`: normalized item work for pens, knives, or future product
  types.
- `scraper-images`: ImageKit upload/delete work.

Producer jobs fetch upstream data, normalize enough to identify each item, and
enqueue item jobs. They do not upload images directly.

The processor job drains queued work, upserts Postgres tables, writes version
snapshots, enqueues or processes image jobs, uploads ImageKit images, and handles
pending deletes.

Use deterministic job IDs so retries and duplicate scrape runs are idempotent:

```txt
autmog:pen:<sourceProductId>:<detailsHash>
autmog:image:<sourceProductId>:<imageHash>
grimsmo-saga:pen:<sourceProductId>:<detailsHash>
grimsmo-knife:knife:<sourceProductId>:<detailsHash>
```

Configure retries with exponential backoff and conservative concurrency. Treat
BullMQ delivery as at-least-once; every handler must be safe to process more
than once.

Recommended initial processor tuning:

| Variable | Initial value | Notes |
| --- | --- | --- |
| `SCRAPER_ITEM_BATCH_SIZE` | `100` | Enough to drain current Autmog in a small number of processor runs without making each run too large. |
| `SCRAPER_IMAGE_BATCH_SIZE` | `25` | Keeps ImageKit/network work bounded; increase after observing runtime and failure rate. |
| `SCRAPER_QUEUE_CONCURRENCY` | `3` | Conservative starting point for DB, Redis, ImageKit, and upstream friendliness. |

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
- ImageKit: `IMAGE_KIT_PRIVATE_KEY`, `IMAGE_KIT_PUBLIC_KEY`, and any endpoint
  value required by the selected ImageKit client
- Logger: `AXIOM_TOKEN`, `AXIOM_DATASET`, optional `AXIOM_EDGE_DOMAIN`,
  `LOG_LEVEL`, and `LOGGER`
- Stage 2 Grimsmo proxying: try direct fetches without `GRIMSMO_PROXY_URL`
  first; add `GRIMSMO_PROXY_URL` only if Railway/direct IP fetches are blocked

## Deployment Notes

- Keep one Railway service for `apps/scraper`.
- Run the scheduled service with `pnpm --filter @app/scraper run start:scheduled`.
- Do not rely on Redis for historical state. Persist current state and
  idempotency markers in Postgres.
- Make the processor safe to stop mid-run. Pending queue jobs and Postgres image
  statuses should let the next run resume.
- Keep concurrency low by default, then tune from logs after production runs.
