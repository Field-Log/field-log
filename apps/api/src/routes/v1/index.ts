import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppDependencies } from "../dependencies.js";
import { createApiDocsRouter } from "./docs/index.js";
import { createHealthRouter } from "./health/index.js";
import { createLogsRouter } from "./logs/index.js";
import { createOpenApiRouter, getOpenApiDocument } from "./openapi/index.js";

export const apiV1Prefix = "/api/v1";

export function createApiV1Router(dependencies: AppDependencies = {}) {
  const router = new OpenAPIHono();

  router.route("/", createHealthRouter());
  router.route("/", createLogsRouter(dependencies));

  return router;
}

export function mountApiV1Routes(
  app: OpenAPIHono,
  dependencies: AppDependencies = {},
) {
  app.route(apiV1Prefix, createApiV1Router(dependencies));
  app.route(
    apiV1Prefix,
    createOpenApiRouter(() => getOpenApiDocument(app)),
  );
  app.route(apiV1Prefix, createApiDocsRouter());

  return app;
}
