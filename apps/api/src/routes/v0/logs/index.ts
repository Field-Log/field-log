import { type LogData, loggerValues } from "@package/logger";
import { Hono } from "hono";
import {
  type AppDependencies,
  getConfiguredLogger,
  getRuntimeConfig,
} from "../../dependencies.js";
import { parseClientLogEvents } from "./parse-client-log-events.js";

export function createLogsRouter(dependencies: AppDependencies = {}) {
  const router = new Hono();

  router.post("/logs", async (context) => {
    const runtimeConfig = await getRuntimeConfig(context, dependencies);
    const configuredClientKey = runtimeConfig.clientLogKey;

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

    const logger = runtimeConfig.logger ?? (await getConfiguredLogger());
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

  return router;
}
