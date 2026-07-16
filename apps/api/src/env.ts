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
    MOBILE_ANDROID_STORE_URL: process.env.MOBILE_ANDROID_STORE_URL,
    MOBILE_IOS_STORE_URL: process.env.MOBILE_IOS_STORE_URL,
    MOBILE_LATEST_VERSION: process.env.MOBILE_LATEST_VERSION,
    MOBILE_MIN_SUPPORTED_VERSION: process.env.MOBILE_MIN_SUPPORTED_VERSION,
    MOBILE_UPDATE_SEVERITY: process.env.MOBILE_UPDATE_SEVERITY,
    PORT: process.env.PORT,
  };
}

export const apiEnv = createApiEnv(readProcessApiRuntimeEnv());
