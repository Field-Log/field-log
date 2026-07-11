import { Hono } from "hono";
import type { AppDependencies } from "./routes/dependencies.js";
import { apiV1Prefix, createApiV1Router } from "./routes/v1/index.js";

export type {
  AppDependencies,
  AppRuntimeConfig,
} from "./routes/dependencies.js";

export function createApp(dependencies: AppDependencies = {}) {
  const app = new Hono();

  app.route(apiV1Prefix, createApiV1Router(dependencies));

  return app;
}

const app = createApp();

export default app;
