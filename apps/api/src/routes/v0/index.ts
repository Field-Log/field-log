import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppDependencies } from "../dependencies.js";
import { createApiDocsRouter } from "./docs/index.js";
import { createFeatureFlagsRouter } from "./feature-flags/index.js";
import { createHealthRouter } from "./health/index.js";
import { createLogsRouter } from "./logs/index.js";
import { createMobileVersionRouter } from "./mobile-version/index.js";
import { createOpenApiRouter, getOpenApiDocument } from "./openapi/index.js";

export const apiV0Prefix = "/api/v0";

export function createApiV0Router(dependencies: AppDependencies = {}) {
  const router = new OpenAPIHono();

  router.route("/", createHealthRouter());
  router.route("/", createFeatureFlagsRouter(dependencies));
  router.route("/", createLogsRouter(dependencies));
  router.route("/", createMobileVersionRouter(dependencies));

  return router;
}

export function mountApiV0Routes(
  app: OpenAPIHono,
  dependencies: AppDependencies = {},
) {
  app.route(apiV0Prefix, createApiV0Router(dependencies));
  app.route(
    apiV0Prefix,
    createOpenApiRouter(() => getOpenApiDocument(app)),
  );
  app.route(apiV0Prefix, createApiDocsRouter());

  return app;
}
