import { createScraperEnv } from "./env.schema.js";

export function readProcessScraperRuntimeEnv() {
  return {
    APP_ENV: process.env.APP_ENV,
    PORT: process.env.PORT,
  };
}

export const scraperEnv = createScraperEnv(readProcessScraperRuntimeEnv());
