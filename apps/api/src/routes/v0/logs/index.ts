import { OpenAPIHono } from "@hono/zod-openapi";
import { type LogData, loggerValues } from "@package/logger";
import {
  ClientLogAcceptedResponseSchema,
  ClientLogHeadersSchema,
  ClientLogRequestSchema,
  ErrorResponseSchema,
  jsonContent,
} from "../../../openapi.js";
import {
  type AppDependencies,
  getConfiguredLogger,
  getRuntimeConfig,
} from "../../dependencies.js";
import { parseClientLogEvents } from "./parse-client-log-events.js";

export function createLogsRouter(dependencies: AppDependencies = {}) {
  const router = new OpenAPIHono();

  router.openAPIRegistry.registerPath({
    method: "post",
    path: "/logs",
    operationId: "createClientLogs",
    summary: "Accept client log events",
    description:
      "Accepts a single client log event, an array of log events, or an object with an events array.",
    tags: ["Logs"],
    request: {
      headers: ClientLogHeadersSchema,
      body: {
        required: true,
        description:
          "A client log event, an array of client log events, or an event batch object.",
        content: jsonContent(ClientLogRequestSchema),
      },
    },
    responses: {
      200: {
        description: "The client log events were accepted.",
        content: jsonContent(ClientLogAcceptedResponseSchema),
      },
      400: {
        description: "The request body was not valid JSON or log event data.",
        content: jsonContent(ErrorResponseSchema),
      },
      401: {
        description: "The configured client log key did not match.",
        content: jsonContent(ErrorResponseSchema),
      },
      500: {
        description: "The API could not process the request.",
        content: jsonContent(ErrorResponseSchema),
      },
    },
  });

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
