import {
  createAxiomTransport,
  createConsoleTransport,
  loggerValues,
  normalizeConsoleTransportMode,
  normalizeLogLevel,
} from "@repo/logger";
import type { Services } from "@repo/services";
import { createServices } from "@repo/services";
import { type ApiRuntimeEnv, createApiEnv } from "../env.schema.js";

export type ApiServicesRuntime = {
  apiEnv: ReturnType<typeof createApiEnv>;
  services: Services;
};

export function createApiServices(
  runtimeEnv: ApiRuntimeEnv,
): ApiServicesRuntime {
  const configuredApiEnv = createApiEnv(runtimeEnv);
  const configuredServices = createServices();

  configureApiServices(configuredServices, configuredApiEnv);

  return {
    apiEnv: configuredApiEnv,
    services: configuredServices,
  };
}

export function configureApiServices(
  configuredServices: Services,
  configuredApiEnv: ReturnType<typeof createApiEnv>,
): void {
  const environment = getApiEnvironment(configuredApiEnv);
  const isDevelopment = environment === "development";
  const consoleTransport = createConsoleTransport({
    mode: normalizeConsoleTransportMode(configuredApiEnv.LOGGER),
  });

  const transports = [
    ...(configuredApiEnv.AXIOM_TOKEN && configuredApiEnv.AXIOM_DATASET
      ? [
          createAxiomTransport({
            dataset: configuredApiEnv.AXIOM_DATASET,
            edgeDomain: configuredApiEnv.AXIOM_EDGE_DOMAIN,
            token: configuredApiEnv.AXIOM_TOKEN,
          }),
        ]
      : []),
    ...(isDevelopment ||
    !(configuredApiEnv.AXIOM_TOKEN && configuredApiEnv.AXIOM_DATASET)
      ? [consoleTransport]
      : []),
  ];

  const logger = {
    app: loggerValues.apps.api,
    environment,
    level: normalizeLogLevel(configuredApiEnv.LOG_LEVEL),
    transports,
  };

  configuredServices.configure({
    db: {
      databaseUrl: configuredApiEnv.DATABASE_URL,
    },
    logger,
  });
}

function getApiEnvironment(configuredApiEnv: ReturnType<typeof createApiEnv>) {
  if (configuredApiEnv.APP_ENV) {
    return configuredApiEnv.APP_ENV;
  }

  if (typeof process !== "undefined" && process.env.NODE_ENV) {
    return process.env.NODE_ENV;
  }

  return "development";
}
