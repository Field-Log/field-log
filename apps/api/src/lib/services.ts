import {
  createAxiomTransport,
  createConsoleTransport,
  loggerValues,
  normalizeConsoleTransportMode,
  normalizeLogLevel,
} from "@package/logger";
import services from "@package/services";
import { apiEnv } from "../env.js";

const environment = process.env.NODE_ENV ?? "development";
const isDevelopment = environment === "development";
const consoleTransport = createConsoleTransport({
  mode: normalizeConsoleTransportMode(apiEnv.LOGGER),
});

const transports = [
  ...(apiEnv.AXIOM_TOKEN && apiEnv.AXIOM_DATASET
    ? [
        createAxiomTransport({
          dataset: apiEnv.AXIOM_DATASET,
          edgeDomain: apiEnv.AXIOM_EDGE_DOMAIN,
          token: apiEnv.AXIOM_TOKEN,
        }),
      ]
    : []),
  ...(isDevelopment || !(apiEnv.AXIOM_TOKEN && apiEnv.AXIOM_DATASET)
    ? [consoleTransport]
    : []),
];

const logger = {
  app: loggerValues.apps.api,
  environment,
  level: normalizeLogLevel(apiEnv.LOG_LEVEL),
  transports,
};

services.configure({
  db: {
    databaseUrl: apiEnv.DATABASE_URL,
  },
  logger,
});

export { services as s };
