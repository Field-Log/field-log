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
from `/apps/api`.

Generated migration files are committed under `packages/database/drizzle/`. Schema source of truth remains in `packages/database/src/schema/`.

CI runs:

```sh
pnpm --filter @package/database exec drizzle-kit check --config=drizzle.config.ts
```

This fails inconsistent Drizzle migration history before merge.

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
a branch-specific Vercel Preview `DATABASE_URL` for the web preview branch.

When a PR has no DB changes, the API preview uses the shared `staging` branch and
the workflow removes stale `preview-pr-*` branches and stale Vercel branch
database overrides.

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
