import {
  createAxiomTransport,
  createConsoleTransport,
  createLogger,
  loggerMessages,
  loggerValues,
  normalizeLogLevel,
} from "@package/logger";
import { createApp } from "./app.js";
import { ApiEnvValidationError, type ApiRuntimeEnv } from "./env.schema.js";
import { createApiServices } from "./lib/create-services.js";

export type CloudflareApiBindings = ApiRuntimeEnv;

export type CloudflareScheduledEvent = {
  cron: string;
  scheduledTime: number;
};

export type CloudflareExecutionContext = {
  waitUntil(promise: Promise<unknown>): void;
};

const app = createApp({
  getRuntimeConfig(context) {
    const { apiEnv, services } = createApiServices(
      context.env as CloudflareApiBindings,
    );

    return {
      clientLogKey: apiEnv.LOG_PROXY_CLIENT_KEY,
      logger: services.logger,
    };
  },
});

app.onError(async (error, context) => {
  await logWorkerException(error, context.env as CloudflareApiBindings, {
    method: context.req.method,
    path: new URL(context.req.url).pathname,
    source: "cloudflare-worker",
    trigger: "fetch",
  });

  return context.json({ error: "Internal server error." }, 500);
});

type HonoExecutionContext = Parameters<typeof app.fetch>[2];

export async function handleWorkerFetch(
  request: Request,
  env: CloudflareApiBindings,
  context: CloudflareExecutionContext,
): Promise<Response> {
  try {
    return await app.fetch(request, env, context as HonoExecutionContext);
  } catch (error) {
    const url = new URL(request.url);

    await logWorkerException(error, env, {
      method: request.method,
      path: url.pathname,
      source: "cloudflare-worker",
      trigger: "fetch",
    });

    return Response.json({ error: "Internal server error." }, { status: 500 });
  }
}

export async function runHourlyCron(
  event: CloudflareScheduledEvent,
  env: CloudflareApiBindings,
): Promise<void> {
  const { services } = createApiServices(env);

  services.logger.info(loggerMessages.api.cronHourly, {
    attributes: {
      cron: event.cron,
      scheduledAt: new Date(event.scheduledTime).toISOString(),
      source: "cloudflare-cron",
    },
  });

  await services.logger.flush();
}

export async function runScheduled(
  event: CloudflareScheduledEvent,
  env: CloudflareApiBindings,
): Promise<void> {
  try {
    await runHourlyCron(event, env);
  } catch (error) {
    await logWorkerException(error, env, {
      cron: event.cron,
      scheduledAt: new Date(event.scheduledTime).toISOString(),
      source: "cloudflare-cron",
      trigger: "scheduled",
    });
  }
}

async function logWorkerException(
  error: unknown,
  env: CloudflareApiBindings,
  attributes: Record<string, unknown>,
): Promise<void> {
  const transports = [
    ...(env.AXIOM_TOKEN && env.AXIOM_DATASET
      ? [
          createAxiomTransport({
            dataset: env.AXIOM_DATASET,
            edgeDomain: env.AXIOM_EDGE_DOMAIN,
            token: env.AXIOM_TOKEN,
          }),
        ]
      : []),
    createConsoleTransport(),
  ];
  const logger = createLogger({
    app: loggerValues.apps.api,
    environment: env.APP_ENV ?? "unknown",
    level: normalizeLogLevel(env.LOG_LEVEL),
    transports,
  });

  logger.error(loggerMessages.api.workerUnhandledException, {
    attributes: {
      ...attributes,
      ...getExceptionAttributes(error),
    },
    error,
  });

  await logger.flush();
}

function getExceptionAttributes(error: unknown): Record<string, unknown> {
  if (!(error instanceof ApiEnvValidationError)) {
    return {};
  }

  return {
    envValidationIssues: error.issues,
    envValidationVariables: error.variables,
  };
}

export default {
  fetch: handleWorkerFetch,
  scheduled(
    event: CloudflareScheduledEvent,
    env: CloudflareApiBindings,
    context: CloudflareExecutionContext,
  ) {
    context.waitUntil(runScheduled(event, env));
  },
};
