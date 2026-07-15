# Railway

`apps/scraper` runs as a TypeScript app on Railway. Stage 1 is a minimal
deployable app with a health endpoint so Railway can be connected to the repo.
Later stages add cron producer and processor commands. The scraper is separate
from the Cloudflare API Worker because scraper runs may exceed Worker Cron
wall-time limits.

Railway owns process scheduling and Redis hosting. Postgres remains the durable
source of truth for scraped rows, image state, run records, and version history.
Redis is only the BullMQ work queue.

## Services

Create these Railway services from the same repository:

| Service | Type | Command | Schedule |
| --- | --- | --- | --- |
| `scraper-health` | Web service | `pnpm --filter @app/scraper start` | Always on; used for Railway health checks. |
| `scraper-autmog` | Cron service | `pnpm --filter @app/scraper run scrape:autmog` | Hourly, for example `5 * * * *`. |
| `scraper-processor` | Cron service | `pnpm --filter @app/scraper run process:queue` | `*/15 * * * *` |
| `redis` | Redis database | Railway Redis template | Always available to scraper services. |

Stage 2 should add source producer services for Grimsmo without changing the
processor shape. Keep Grimsmo producers separate for retry isolation, clearer
logs, and staggered schedules:

| Service | Type | Command | Schedule |
| --- | --- | --- | --- |
| `scraper-grimsmo-saga` | Cron service | `pnpm --filter @app/scraper run scrape:grimsmo-saga` | Hourly, staggered from knife scrapes, for example `0 * * * *`. |
| `scraper-grimsmo-rask` | Cron service | `pnpm --filter @app/scraper run scrape:grimsmo-rask` | Hourly, staggered from other Grimsmo scrapes, for example `20 * * * *`. |
| `scraper-grimsmo-fjell` | Cron service | `pnpm --filter @app/scraper run scrape:grimsmo-fjell` | Hourly, staggered from other Grimsmo scrapes, for example `40 * * * *`. |
| `scraper-grimsmo-norseman` | Cron service | `pnpm --filter @app/scraper run scrape:grimsmo-norseman` | Hourly, staggered from other Grimsmo scrapes, for example `30 * * * *`. |

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

Use `/health` as the Railway healthcheck path for the `scraper-health` web
service.

## Cron Behavior

Railway cron services should do one task and exit. Close database, Redis, and
logger transports before the process exits.

Railway skips a cron execution when the previous execution for that service is
still active. Use the scraper run lock in Postgres as the application-level
guard, and make commands safe to retry.

Railway cron schedules use UTC. The processor schedule should run every 15
minutes:

```txt
*/15 * * * *
```

Autmog and Grimsmo source producers should run hourly. Stagger Grimsmo producers
so Saga, Rask, Fjell, and Norseman source scrapes do not start at the same
minute.

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
`apps/scraper` should not provision Redis at runtime. Reference Redis from each
scraper service through `REDIS_URL`.

Prefer Railway private networking/service variables for production service to
service access. Local development can use a local Redis instance or a
development Redis URL loaded through Infisical.

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

- Keep each Railway cron service scoped to one command.
- Do not run an in-process scheduler inside `apps/scraper`; Railway cron starts
  the process on schedule.
- Do not rely on Redis for historical state. Persist current state and
  idempotency markers in Postgres.
- Make the processor safe to stop mid-run. Pending queue jobs and Postgres image
  statuses should let the next run resume.
- Keep concurrency low by default, then tune from logs after production runs.
