# Database Package

`@repo/database` owns the Drizzle connection factory, schema definitions, and generated SQL migrations for the Neon Postgres database.

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

App code should not create Drizzle clients directly unless it needs a low-level database operation. Normal app usage should go through `@repo/services`.

The database package exports:

```ts
import { createDb } from "@repo/database";

const db = createDb({
  databaseUrl: process.env.DATABASE_URL!,
});
```

`DATABASE_URL` is stored in Infisical at `/neon/server`.

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

`pnpm db:migrate` runs through the Infisical runner so `DATABASE_URL` is loaded from `/neon/server`.

Generated migration files are committed under `packages/database/drizzle/`. Schema source of truth remains in `packages/database/src/schema/`.
