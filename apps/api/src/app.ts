import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import {
  apiDocsPath,
  openApiDocumentConfig,
  openApiGeneratorOptions,
  openApiJsonPath,
} from "./openapi.js";
import type { AppDependencies } from "./routes/dependencies.js";
import { apiV1Prefix, createApiV1Router } from "./routes/v1/index.js";

export type {
  AppDependencies,
  AppRuntimeConfig,
} from "./routes/dependencies.js";

export function createApp(dependencies: AppDependencies = {}) {
  const app = new OpenAPIHono();

  app.route(apiV1Prefix, createApiV1Router(dependencies));
  app.doc31(openApiJsonPath, openApiDocumentConfig, openApiGeneratorOptions);
  app.get(
    apiDocsPath,
    Scalar({
      pageTitle: "Field Log API Reference",
      url: openApiJsonPath,
    }),
  );

  return app;
}

const app = createApp();

export default app;
