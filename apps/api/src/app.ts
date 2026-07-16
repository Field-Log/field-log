import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppDependencies } from "./routes/dependencies.js";
import { mountApiV0Routes } from "./routes/v0/index.js";

export type {
  AppDependencies,
  AppRuntimeConfig,
} from "./routes/dependencies.js";

export function createApp(dependencies: AppDependencies = {}) {
  const app = new OpenAPIHono();

  mountApiV0Routes(app, dependencies);

  return app;
}

const app = createApp();

export default app;
