import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppDependencies } from "../dependencies.js";
import { createHealthRouter } from "./health/index.js";
import { createLogsRouter } from "./logs/index.js";

export const apiV1Prefix = "/api/v1";

export function createApiV1Router(dependencies: AppDependencies = {}) {
  const router = new OpenAPIHono();

  router.route("/", createHealthRouter());
  router.route("/", createLogsRouter(dependencies));

  return router;
}
