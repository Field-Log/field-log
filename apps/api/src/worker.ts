import { loggerMessages } from "@package/logger";
import { createApp } from "./app.js";
import {
  type ApiRuntimeEnv,
  createMobileVersionPolicyFromApiEnv,
} from "./env.schema.js";
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
      mobileVersionPolicy: createMobileVersionPolicyFromApiEnv(apiEnv),
    };
  },
});

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

export default {
  fetch: app.fetch,
  scheduled(
    event: CloudflareScheduledEvent,
    env: CloudflareApiBindings,
    context: CloudflareExecutionContext,
  ) {
    context.waitUntil(runHourlyCron(event, env));
  },
};
