# Database Package

`@package/database` owns the Drizzle connection factory, schema definitions, and generated SQL migrations for the Neon Postgres database.

## Folder Structure

```txt
packages/database/
├── drizzle.config.ts
├── eslint.config.mjs
├── package.json
├── tsconfig.json
├── drizzle/
│   ├── 0000_*.sql
│   └── meta/
│       ├── _journal.json
│       └── 0000_snapshot.json
└── src/
    ├── client.ts
    ├── index.ts
    └── schema/
        ├── enums.ts
        ├── index.ts
        ├── relations.ts
        └── table schema files
```

## Schema Files

- Table schema files define Drizzle table objects and inferred row types.
- `src/schema/scraper.ts` defines scraper-owned tables, including `makers`,
  `scraper_runs`, `tmp_autmog_pens`, `tmp_autmog_pen_images`, and
  `tmp_autmog_pen_versions`, and `tmp_products`.
- `src/schema/enums.ts` defines TypeScript constants and types for allowed setting values.
- `src/schema/relations.ts` defines Drizzle relationships between tables.
- `src/schema/index.ts` re-exports all schema objects for Drizzle config and package consumers.

## Runtime Connection

App code should not create Drizzle clients directly unless it needs a low-level database operation. Normal app usage should go through `@package/services`.

The database package exports:

```ts
import { createDb } from "@package/database";
import { serverEnv } from "@/env/server";

const db = createDb({
  databaseUrl: serverEnv.DATABASE_URL,
});
```

`DATABASE_URL` is stored in Infisical at `/apps/api` for API and migration
commands. The web app keeps its deploy copy in `/apps/web`. The Railway scraper
app keeps its runtime copy in `/apps/scraper`, or receives the equivalent value
through Railway service configuration.

## Migrations

This repo uses a generate and migrate flow.

Generate SQL migrations after changing schema files:

```sh
pnpm db:generate
```

Apply generated migrations:

```sh
pnpm db:migrate
```

`pnpm db:migrate` runs through the Infisical runner so `DATABASE_URL` is loaded
from `/apps/api`. Personal developer overrides such as `DATABASE_URL_RA` are
looked up only from `/local/database`.

Generated migration files are committed under `packages/database/drizzle/`. Schema source of truth remains in `packages/database/src/schema/`.

CI runs:

```sh
pnpm --filter @package/database exec drizzle-kit check --config=drizzle.config.ts
```

This fails inconsistent Drizzle migration history before merge.

## Database Viewer

Run Drizzle Studio, Drizzle Lab Visualizer, and Drizzle View together:

```sh
pnpm db:view
```

The root command delegates to `@package/database`, where the individual viewer
commands live:

| Command | Purpose | Port |
| --- | --- | --- |
| `pnpm --filter @package/database db:studio` | Runs `drizzle-kit studio` from `packages/database` through the Infisical runner. | `4009` |
| `pnpm --filter @package/database db:visualizer` | Runs `drizzle-lab visualizer` against `packages/database/drizzle.config.ts`. | `4010` |
| `pnpm --filter @package/database db:view:shell` | Runs `drizzle-view` with Studio and Visualizer URLs wired in. | `4011` |

`pnpm db:view` starts Studio and Visualizer first, waits for both TCP ports with
`wait-on`, then starts the Drizzle View shell. Open
`http://127.0.0.1:4011` for the combined view.

Drizzle Studio's browser UI is loaded through
`https://local.drizzle.studio?port=4009`. Do not point Drizzle View at
`http://127.0.0.1:4009`; that port is the local Studio bridge endpoint and can
return an empty browser response.

The Drizzle View npm package downloads its platform binary from GitHub on first
run. The repo wrapper at `scripts/drizzle-view.mjs` removes incomplete zero-byte
downloads and fixes executable permissions before delegating to the pinned
`drizzle-view` CLI.

## Schema Docs Metadata

Generated schema documentation should combine Drizzle's generated schema
metadata with a human-authored metadata map. Drizzle can supply table names,
column names, data types, nullability, defaults, primary keys, foreign keys,
indexes, and unique constraints. The metadata map supplies the business meaning
that cannot be inferred from SQL.

Recommended source file:

```txt
packages/database/src/schema/descriptions.ts
```

Recommended metadata shape:

```ts
export const schemaDescriptions = {
  tmp_autmog_pen_images: {
    description: "Images associated with the latest Autmog pen record.",
    columns: {
      id: {
        description: "Internal image row identifier.",
        example: 1000,
      },
      pen_id: {
        description: "Autmog pen row this image belongs to.",
        example: 1000,
      },
      source_hash: {
        description: "Stable hash of the source image identity used to dedupe image rows for the pen.",
        example: "sha256:db2ef0e97513c1dc9d75f55ee8c014c06fc31a459c1c25b12904696bf2ab1c55",
      },
      image_kit_url: {
        description: "ImageKit URL for the optimized uploaded image.",
        example: "https://ik.imagekit.io/example/scrapers/autmog/pens/8158274388155/db2ef0e9.webp",
      },
    },
  },
} as const;
```

The generated Markdown should include one table per database table:

| Column | Type | Required | Key | Relation | Description | Example |
| --- | --- | --- | --- | --- | --- | --- |
| `id` | `bigint` | yes | PK |  | Internal image row identifier. | `1000` |
| `pen_id` | `bigint` | yes | FK | `tmp_autmog_pens.id` | Autmog pen row this image belongs to. | `1000` |
| `source_hash` | `text` | yes |  |  | Stable hash of the source image identity used to dedupe image rows for the pen. | `sha256:db2ef0e97513c1dc9d75f55ee8c014c06fc31a459c1c25b12904696bf2ab1c55` |
| `image_kit_url` | `text` | no |  |  | ImageKit URL for the optimized uploaded image. | `https://ik.imagekit.io/example/scrapers/autmog/pens/8158274388155/db2ef0e9.webp` |

Foreign-key relations should be generated from Drizzle snapshot metadata. For
example, `tmp_autmog_pen_images.pen_id` should render as a relation to
`tmp_autmog_pens.id` without manually duplicating that relationship in the
description map.

## Neon Branches

Use one Neon project with committed Drizzle migrations as the source of truth
for production:

| Branch | Lifetime | Parent | Purpose |
| --- | --- | --- | --- |
| `production` | permanent | root | Production data and schema. |
| `staging` | permanent | `production` | Shared non-production data for previews that do not change DB schema. |
| `dev-<name>` | permanent | `production` | Developer-owned local work branch. |
| `preview-pr-<number>` | ephemeral | `production` | Isolated PR database, created only for DB-changing PRs. |

Local development should use a developer branch. `drizzle-kit push` is allowed
only against developer branches for rapid iteration. Before opening or updating
a PR with schema changes, generate committed migrations with `pnpm db:generate`.

PR branches are disposable. On each DB-changing PR update, the API deploy
workflow recreates `preview-pr-<number>` from `production`, runs committed
migrations against it, deploys the API preview with that `DATABASE_URL`, and sets
a branch-specific Vercel Preview `DATABASE_URL` for the web preview branch. The
same selected `DATABASE_URL` is also pushed into the Railway scraper preview
environment so scraper cron executions use the same database branch as the API
and web previews.

When a PR has no DB changes, the API preview uses the shared `staging` branch and
the workflow removes stale `preview-pr-*` branches and stale Vercel branch
database overrides. The Railway scraper preview environment is updated to the
selected shared `staging` `DATABASE_URL` in that case.

## Parallel DB PRs

Drizzle migration history is linear. Parallel DB PRs may preview independently,
but after one merges, the other DB PRs must rebase or merge latest `main`, remove
stale generated migration artifacts, and regenerate from the new mainline
history.

Print the Codex prompt for this repair flow with:

```sh
pnpm db:resolve-conflicts
```

The prompt uses the repo-local `$db-migration-conflicts` skill and instructs
Codex to preserve schema intent, preserve hand-written SQL, remove stale
generated artifacts, regenerate migrations, and run `drizzle-kit check`.
