# Services Package

`@repo/services` exposes app-facing service methods. It is the normal way for app code to use the database.

The package is environment-neutral. It does not read `process.env` itself. Each server app configures it once with app-local credentials.

## Public API

Import the configured app-local service instance as `s`, then use the `s.<namespace>.<service>.<method>` shape:

```ts
await s.db.users.ensure({ clerkId });

await s.db.userSettings.getByClerkId(clerkId);

await s.db.userSettings.upsertForClerkId(clerkId, {
  currencyCode: "CAD",
  dimensionUnit: "in",
  theme: "dark",
  weightUnit: "g",
});
```

## App Configuration

Configure services once in each server app.

`apps/api/src/lib/services.ts`

```ts
import services from "@repo/services";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to configure services.");
}

services.configure({
  db: {
    databaseUrl,
  },
});

export { services as s };
```

`apps/web/src/lib/services.ts`

```ts
import process from "node:process";
import services from "@repo/services";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to configure services.");
}

services.configure({
  db: {
    databaseUrl,
  },
});

export { services as s };
```

## Import Guidance

In `apps/api`, source files are TypeScript but emitted as Node ESM. Relative imports should use the emitted `.js` extension:

```ts
import { s } from "./lib/services.js";
```

In `apps/web`, import the configured module from server-side code:

```ts
import { s } from "@/lib/services";
```

Only import the web services module from SSR code, server functions, loaders, or other server-only modules. Do not import it from client components.

## Boundaries

- `apps/api` can use services directly.
- `apps/web` can use services from SSR/server-side tasks.
- `apps/mobile` must not receive `DATABASE_URL` and must not use database services directly. Mobile should call `apps/api` for persisted user or settings behavior.

If code uses `@repo/services` before app-local configuration runs, it throws a clear initialization error.

## Adding Services

Add future database services under `s.db.<service>.<method>`.

For non-database domains, add a new top-level namespace under `s.<namespace>.<method>` only when that domain has its own cohesive service boundary.
