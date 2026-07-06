import { type LogData, type Logger, loggerValues } from "@repo/logger";
import type { HealthResponse, ServiceInfoResponse } from "@repo/types";
import { Hono } from "hono";
import { parseClientLogEvents } from "./logs.js";

export type AppDependencies = {
  clientLogKey?: string;
  logger?: Logger;
};

export function createApp(dependencies: AppDependencies = {}) {
  const app = new Hono();

  app.get("/", (context) => {
    return context.json({
      name: "machinedpens-api",
      status: "ok",
    } satisfies ServiceInfoResponse);
  });

  app.get("/health", (context) => {
    return context.json({
      ok: true,
      service: "api",
    } satisfies HealthResponse);
  });

  app.post("/logs", async (context) => {
    const configuredClientKey =
      dependencies.clientLogKey ?? process.env.LOG_PROXY_CLIENT_KEY;

    if (configuredClientKey) {
      const providedClientKey = context.req.header(
        loggerValues.logProxy.clientKeyHeader,
      );

      if (providedClientKey !== configuredClientKey) {
        return context.json({ error: "Invalid log client key." }, 401);
      }
    }

    let body: unknown;

    try {
      body = await context.req.json();
    } catch {
      return context.json({ error: "Expected a JSON request body." }, 400);
    }

    const events = parseClientLogEvents(body);

    if (!events.ok) {
      return context.json({ error: events.error }, 400);
    }

    const logger = dependencies.logger ?? (await getConfiguredLogger());
    const receivedAt = new Date().toISOString();
    const userAgent = context.req.header("user-agent");

    for (const event of events.value) {
      const attributes: Record<string, unknown> = {
        ...(event.attributes ?? {}),
        clientApp: event.app,
        clientEnvironment: event.environment,
        originalTimestamp: event.timestamp,
        receivedAt,
        source: loggerValues.logProxy.source,
      };

      if (event.error) {
        attributes.clientError = event.error;
      }

      if (userAgent) {
        attributes.userAgent = userAgent;
      }

      const logData: LogData = {
        attributes,
        context: event.context,
      };

      if (event.rawPayload !== undefined) {
        logData.includeRawPayload = true;
        logData.rawPayload = event.rawPayload;
      }

      logger[event.level](event.message, logData);
    }

    await logger.flush();

    return context.json({
      accepted: events.value.length,
    });
  });

  return app;
}

const app = createApp();

export default app;

async function getConfiguredLogger(): Promise<Logger> {
  const { s } = await import("./lib/services.js");

  return s.logger;
}
