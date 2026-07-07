import process from "node:process";
import {
  createAxiomTransport,
  createConsoleTransport,
  loggerValues,
  normalizeConsoleTransportMode,
  normalizeLogLevel,
} from "@package/logger";
import services from "@package/services";
import { serverEnv } from "@/env/server";

const environment = process.env.NODE_ENV ?? "development";
const isDevelopment = environment === "development";
const consoleTransport = createConsoleTransport({
  mode: normalizeConsoleTransportMode(serverEnv.LOGGER),
});

const transports = [
  ...(serverEnv.AXIOM_TOKEN && serverEnv.AXIOM_DATASET
    ? [
        createAxiomTransport({
          dataset: serverEnv.AXIOM_DATASET,
          edgeDomain: serverEnv.AXIOM_EDGE_DOMAIN,
          token: serverEnv.AXIOM_TOKEN,
        }),
      ]
    : []),
  ...(isDevelopment || !(serverEnv.AXIOM_TOKEN && serverEnv.AXIOM_DATASET)
    ? [consoleTransport]
    : []),
];

const logger = {
  app: loggerValues.apps.web,
  environment,
  level: normalizeLogLevel(serverEnv.LOG_LEVEL),
  transports,
};

services.configure({
  db: {
    databaseUrl: serverEnv.DATABASE_URL,
  },
  logger,
});

export { services as s };
