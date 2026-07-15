import { OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";
import { openApiJsonPath } from "../../../openapi.js";

export const apiDocsRoutePath = "/docs";

export function createApiDocsRouter() {
  const router = new OpenAPIHono();

  router.get(
    apiDocsRoutePath,
    Scalar({
      pageTitle: "Field Log API Reference",
      url: openApiJsonPath,
    }),
  );

  return router;
}
