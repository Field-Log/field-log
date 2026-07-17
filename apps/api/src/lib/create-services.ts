import {
  createAxiomTransport,
  createConsoleTransport,
  createLogger,
  type Logger,
  type LoggerConfig,
  loggerValues,
  normalizeConsoleTransportMode,
  normalizeLogLevel,
} from "@package/logger";
import type { Services } from "@package/services";
import { createServices } from "@package/services";
import {
  type ApiLoggerRuntimeEnv,
  type ApiRuntimeEnv,
  createApiEnv,
  createApiLoggerEnv,
} from "../env.schema.js";

export type ApiServicesRuntime = {
  apiEnv: ReturnType<typeof createApiEnv>;
  services: Services;
};

export type ApiLoggerRuntime = {
  apiEnv: ReturnType<typeof createApiLoggerEnv>;
  logger: Logger;
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

export function createApiLoggerRuntime(
  runtimeEnv: ApiLoggerRuntimeEnv,
): ApiLoggerRuntime {
  const configuredApiEnv = createApiLoggerEnv(runtimeEnv);

  return {
    apiEnv: configuredApiEnv,
    logger: createLogger(createApiLoggerConfig(configuredApiEnv)),
  };
}

export function configureApiServices(
  configuredServices: Services,
  configuredApiEnv: ReturnType<typeof createApiEnv>,
): void {
  const logger = createApiLoggerConfig(configuredApiEnv);

  configuredServices.configure({
    db: {
      databaseUrl: configuredApiEnv.DATABASE_URL,
    },
    logger,
  });
}

function createApiLoggerConfig(
  configuredApiEnv:
    | ReturnType<typeof createApiEnv>
    | ReturnType<typeof createApiLoggerEnv>,
): LoggerConfig {
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

  return {
    app: loggerValues.apps.api,
    environment,
    level: normalizeLogLevel(configuredApiEnv.LOG_LEVEL),
    transports,
  };
}

function getApiEnvironment(
  configuredApiEnv:
    | ReturnType<typeof createApiEnv>
    | ReturnType<typeof createApiLoggerEnv>,
) {
  if (configuredApiEnv.APP_ENV) {
    return configuredApiEnv.APP_ENV;
  }

  if (typeof process !== "undefined" && process.env.NODE_ENV) {
    return process.env.NODE_ENV;
  }

  return "development";
}
