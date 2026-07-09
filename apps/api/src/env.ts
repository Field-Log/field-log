import { createApiEnv } from "./env.schema.js";

export function readProcessApiRuntimeEnv() {
  return {
    APP_ENV: process.env.APP_ENV,
    AXIOM_DATASET: process.env.AXIOM_DATASET,
    AXIOM_EDGE_DOMAIN: process.env.AXIOM_EDGE_DOMAIN,
    AXIOM_TOKEN: process.env.AXIOM_TOKEN,
    DATABASE_URL: process.env.DATABASE_URL,
    LOGGER: process.env.LOGGER,
    LOG_LEVEL: process.env.LOG_LEVEL,
    LOG_PROXY_CLIENT_KEY: process.env.LOG_PROXY_CLIENT_KEY,
    PORT: process.env.PORT,
  };
}

export const apiEnv = createApiEnv(readProcessApiRuntimeEnv());
