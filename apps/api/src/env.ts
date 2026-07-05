import { createApiEnv } from "./env.schema.js";

export const apiEnv = createApiEnv({
  DATABASE_URL: process.env.DATABASE_URL,
  PORT: process.env.PORT,
});
