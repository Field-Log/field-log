# Logger

`@package/logger` is the shared logging package for server and client code. Server
apps send directly to Axiom. Browser and Expo clients send to the API log proxy
so provider credentials are never bundled into client builds.

## Local Ports

Local development uses stable ports:

- Web: `http://localhost:4005`
- API: `http://localhost:4006`
- Client log proxy: `http://localhost:4006/logs`

## Axiom Setup

Use one Axiom dataset per environment:

- Development: `development`
- Production: `production`

Keep the app name on each event with `app: "api"`, `app: "web"`, or
`app: "expo"`. This keeps cross-app flows queryable in one dataset. Split into
per-app datasets only if access, retention, or cost controls need to differ by
app.

## Infisical

`/axiom/server` provides server-only Axiom settings:

- `AXIOM_TOKEN`
- `AXIOM_DATASET`
- `AXIOM_EDGE_DOMAIN`, optional
- `LOG_LEVEL`, optional
- `LOGGER`, optional

Do not put `LOG_PROXY_URL` or `LOG_PROXY_CLIENT_KEY` in `/axiom/server`; proxy
configuration belongs to `/logging`.

`AXIOM_TOKEN` must have ingest access for the configured dataset.
`LOGGER=verbose` makes development terminal logs print the full event. Omit it
for compact terminal logs.

Recommended values:

```dotenv
# Development
AXIOM_DATASET=development
LOG_LEVEL=debug
# LOGGER=verbose

# Production
AXIOM_DATASET=production
LOG_LEVEL=info
```

Omit `AXIOM_EDGE_DOMAIN` unless Axiom has given the project a custom edge
domain.

`/logging` provides client-safe proxy settings:

- `LOG_PROXY_URL`
- `LOG_PROXY_CLIENT_KEY`, optional

`LOG_PROXY_URL` has a single Infisical owner: `/logging/LOG_PROXY_URL`.

Local development:

```dotenv
LOG_PROXY_URL=http://localhost:4006/logs
```

Production:

```dotenv
LOG_PROXY_URL=https://<api-domain>/logs
```

`LOG_PROXY_CLIENT_KEY` is an anti-noise check for `POST /logs`, not a security
boundary. If it is configured, the API and client builds must receive the same
value.

The Infisical runner aliases client-safe logging values for builds:

- Web: `VITE_LOG_PROXY_URL`, `VITE_LOG_PROXY_CLIENT_KEY`
- Expo: `EXPO_PUBLIC_LOG_PROXY_URL`, `EXPO_PUBLIC_LOG_PROXY_CLIENT_KEY`

Production environments should provide the public build variables directly when
they are not using the Infisical alias runner:

- `VITE_LOG_PROXY_URL`
- `VITE_LOG_PROXY_CLIENT_KEY`, optional
- `EXPO_PUBLIC_LOG_PROXY_URL`
- `EXPO_PUBLIC_LOG_PROXY_CLIENT_KEY`, optional

## Package Build

`@package/logger` exports from `dist`:

```json
{
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts"
}
```

`pnpm build`, `pnpm test`, and `pnpm typecheck` build workspace dependencies
through Turbo. Local dev commands also include `@package/logger` and run its watch
build, so logger source changes update `packages/logger/dist` while the apps are
running.

Use normal dev commands:

```sh
pnpm dev:web
pnpm dev:ios
pnpm dev:android
```

## Development Terminal Logs

Server apps print JSON newline-delimited logs to the terminal in development,
even when Axiom is configured. The default terminal shape is compact:

```json
{
  "app": "api",
  "durationMs": 12,
  "environment": "development",
  "level": "info",
  "message": "db.query.succeeded",
  "operation": "db.query",
  "outcome": "success",
  "timestamp": "2026-01-01T00:00:00.000Z"
}
```

Set `LOGGER=verbose` to print the full redacted event, including full context,
attributes, errors, and raw payloads that were explicitly logged.

## Logger Messages And Values

Reusable logger messages and protocol values live in `@package/logger`:

```ts
import { loggerMessages, loggerValues } from "@package/logger";
```

Use stable event IDs from `loggerMessages`; put dynamic values in `attributes`.
Use `loggerValues` for logger app identifiers and log proxy protocol values.

## Live Axiom Test

The live logger test is explicit and is not part of `pnpm test` or
`pnpm test:ci`.

Run it only when intentionally validating the real Axiom integration:

```sh
pnpm test:logger:axiom
```

The command loads secrets through the Infisical runner. `/axiom/automated-tests`
must provide:

- `AXIOM_TOKEN`
- `AXIOM_DATASET=testing`
- `LOG_LEVEL`, currently `trace`
- optional `AXIOM_EDGE_DOMAIN`

`/logging` must provide:

- `LOG_PROXY_CLIENT_KEY`

The test hard-fails unless `AXIOM_DATASET` is `testing` and `LOG_LEVEL` is
`trace`. It emits direct logger events and in-process client proxy events, then
queries Axiom to confirm the events were received, levels were preserved,
context and operation metadata were recorded, and sensitive values were redacted.

The dedicated GitHub Actions workflow is `.github/workflows/logger-live.yml`.
It runs the live check for same-repository pull requests that touch
logger-relevant files and can also be run manually with `workflow_dispatch`.
In CI, the workflow authenticates to Infisical with OIDC, fetches `/common`,
`/logging`, and `/axiom/automated-tests`, then runs the live script directly.
Configure these GitHub repository variables:

- `INFISICAL_LOGGER_IDENTITY_ID`
- `INFISICAL_PROJECT_SLUG`
- optional `INFISICAL_DOMAIN`
- optional `INFISICAL_ENV_SLUG`
- optional `INFISICAL_OIDC_AUDIENCE`

See `plans/configure-repo-for-logger.md` for the Infisical identity setup.

## Server Configuration

Each server app configures services locally. The services package is
environment-neutral and does not read `process.env` itself.

API configuration:

```ts
import {
  createAxiomTransport,
  createConsoleTransport,
  loggerValues,
  normalizeConsoleTransportMode,
  normalizeLogLevel,
} from "@package/logger";
import services from "@package/services";

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
    ? [
        createAxiomTransport({
          dataset: axiomDataset,
          edgeDomain: process.env.AXIOM_EDGE_DOMAIN,
          token: axiomToken,
        }),
      ]
    : []),
  ...(isDevelopment || !(axiomToken && axiomDataset) ? [consoleTransport] : []),
];

const logger = {
  app: loggerValues.apps.api,
  environment,
  level: normalizeLogLevel(process.env.LOG_LEVEL),
  transports,
};

services.configure(databaseUrl ? { db: { databaseUrl }, logger } : { logger });

export { services as s };
```

Server-side web configuration uses the same pattern with
`app: loggerValues.apps.web`.

## API Usage

Use the configured service instance in API code:

```ts
import { s } from "./lib/services.js";
import { loggerMessages } from "@package/logger";

app.get("/health", (context) => {
  s.logger.info(loggerMessages.api.healthChecked, {
    attributes: {
      route: "/health",
    },
  });

  return context.json({
    ok: true,
    service: "api",
  });
});
```

Wrap timed work with `operation`:

```ts
const settings = await s.logger.operation(
  loggerMessages.database.userSettings.getByClerkId,
  async () => {
    return await s.db.userSettings.getByClerkId(clerkId);
  },
  {
    attributes: {
      clerkId,
    },
  },
);
```

## Server-Side Web Usage

Use the configured web services module only from SSR code, server functions, or
loaders:

```ts
import { createServerFn } from "@tanstack/react-start";
import { loggerMessages } from "@package/logger";
import { s } from "@/lib/services";

export const getAccount = createServerFn().handler(async () => {
  s.logger.info(loggerMessages.web.accountLoaded, {
    attributes: {
      route: "/user/account",
    },
  });

  return await s.logger.operation("db.account.load", async () => {
    return await s.db.userSettings.getByClerkId("clerk-user-id");
  });
});
```

Do not import `@package/services` or `apps/web/src/lib/services.ts` from client
components.

## Browser Client Usage

Browser code imports the app-local logger from `apps/web/src/lib/logger.ts`:

```ts
import { logger } from "@/lib/logger";
import { loggerMessages } from "@package/logger";

logger.warn(loggerMessages.web.fxRatesFetchFailed, {
  attributes: {
    baseCurrency,
  },
});
```

The app-local module owns the browser proxy configuration:

```ts
import { createLogger, createProxyTransport, loggerValues } from "@package/logger";

const logProxyUrl = import.meta.env.VITE_LOG_PROXY_URL;

const transports = logProxyUrl
  ? [
      createProxyTransport({
        clientKey: import.meta.env.VITE_LOG_PROXY_CLIENT_KEY,
        url: logProxyUrl,
      }),
    ]
  : [];

export const logger = createLogger({
  app: loggerValues.apps.web,
  environment: import.meta.env.MODE,
  transports,
});
```

## Expo Client Usage

Expo code imports the app-local logger from `apps/mobile/src/lib/logger.ts`:

```ts
import { logger } from "./src/lib/logger";
import { loggerMessages } from "@package/logger";

logger.info(loggerMessages.mobile.screenViewed, {
  attributes: {
    screen: "Library",
  },
});
```

The Expo app-local module owns the proxy configuration:

```ts
import { createLogger, createProxyTransport, loggerValues } from "@package/logger";

const logProxyUrl = process.env.EXPO_PUBLIC_LOG_PROXY_URL;

const transports = logProxyUrl
  ? [
      createProxyTransport({
        clientKey: process.env.EXPO_PUBLIC_LOG_PROXY_CLIENT_KEY,
        url: logProxyUrl,
      }),
    ]
  : [];

export const logger = createLogger({
  app: loggerValues.apps.mobile,
  environment: __DEV__ ? "development" : "production",
  transports,
});
```

## Log Proxy

The API exposes `POST /logs`. It accepts a single event, an array of events, or
`{ "events": [...] }`. Batches are capped at 25 events. The API validates the
event shape, enriches the event with proxy metadata, redacts again server-side,
and forwards through `s.logger`.

If `LOG_PROXY_CLIENT_KEY` is configured, clients must send it with the
`x-log-client-key` header. The proxy transport handles this automatically.

## Redaction And Payloads

The logger redacts sensitive keys such as `authorization`, `cookie`, `password`,
`secret`, and `token` from context, attributes, errors, and explicit raw
payloads.

Prefer summary-first payload logging:

```ts
import { summarizeApiPayload } from "@package/logger";

s.logger.info("api.integration.response", {
  attributes: summarizeApiPayload(responseBody),
});
```

Raw payload logging requires explicit opt-in at the call site:

```ts
s.logger.debug("api.integration.raw", {
  includeRawPayload: true,
  rawPayload: responseBody,
});
```
