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

s.logger.info("api.health.checked", {
  attributes: {
    route: "/health",
  },
});
```

## App Configuration

Configure services once in each server app.

`apps/api/src/lib/services.ts`

```ts
import {
  createAxiomTransport,
  createConsoleTransport,
  normalizeConsoleTransportMode,
  normalizeLogLevel,
} from "@repo/logger";
import services from "@repo/services";

const databaseUrl = process.env.DATABASE_URL;
const axiomToken = process.env.AXIOM_TOKEN;
const axiomDataset = process.env.AXIOM_DATASET;
const environment = process.env.NODE_ENV ?? "development";
const isDevelopment = environment === "development";
const consoleTransport = createConsoleTransport({
  mode: normalizeConsoleTransportMode(process.env.LOGGER),
});
const transports = [
  ...(axiomToken && axiomDataset
    ? [createAxiomTransport({ dataset: axiomDataset, token: axiomToken })]
    : []),
  ...(isDevelopment || !(axiomToken && axiomDataset) ? [consoleTransport] : []),
];

services.configure({
  db: databaseUrl ? { databaseUrl } : undefined,
  logger: {
    app: "api",
    environment,
    level: normalizeLogLevel(process.env.LOG_LEVEL),
    transports,
  },
});

export { services as s };
```

`apps/web/src/lib/services.ts`

```ts
import process from "node:process";
import {
  createAxiomTransport,
  createConsoleTransport,
  normalizeConsoleTransportMode,
  normalizeLogLevel,
} from "@repo/logger";
import services from "@repo/services";

const databaseUrl = process.env.DATABASE_URL;
const axiomToken = process.env.AXIOM_TOKEN;
const axiomDataset = process.env.AXIOM_DATASET;
const environment = process.env.NODE_ENV ?? "development";
const isDevelopment = environment === "development";
const consoleTransport = createConsoleTransport({
  mode: normalizeConsoleTransportMode(process.env.LOGGER),
});
const transports = [
  ...(axiomToken && axiomDataset
    ? [createAxiomTransport({ dataset: axiomDataset, token: axiomToken })]
    : []),
  ...(isDevelopment || !(axiomToken && axiomDataset) ? [consoleTransport] : []),
];

services.configure({
  db: databaseUrl ? { databaseUrl } : undefined,
  logger: {
    app: "web",
    environment,
    level: normalizeLogLevel(process.env.LOG_LEVEL),
    transports,
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
If code uses `s.db` or `s.logger` before that specific service has been configured, only that service throws. For example, an app can configure `s.logger` without `DATABASE_URL`; `s.db` will throw only if database services are actually used.

## Adding Services

Add future database services under `s.db.<service>.<method>`.

For non-database domains, add a new top-level namespace under `s.<namespace>.<method>` only when that domain has its own cohesive service boundary.
