import { Hono } from "hono";
import type { AppDependencies } from "./routes/dependencies.js";
import { apiV0Prefix, createApiV0Router } from "./routes/v0/index.js";

export type {
  AppDependencies,
  AppRuntimeConfig,
} from "./routes/dependencies.js";

export function createApp(dependencies: AppDependencies = {}) {
  const app = new Hono();

  app.route(apiV0Prefix, createApiV0Router(dependencies));

  return app;
}

const app = createApp();

export default app;
