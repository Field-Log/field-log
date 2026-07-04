import {
  createAxiomTransport,
  createConsoleTransport,
  loggerValues,
  normalizeConsoleTransportMode,
  normalizeLogLevel,
} from "@repo/logger";
import services from "@repo/services";

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

services.configure(
  databaseUrl
    ? {
        db: {
          databaseUrl,
        },
        logger,
      }
    : { logger },
);

export { services as s };
