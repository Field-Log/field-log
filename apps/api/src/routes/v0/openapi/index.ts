import { OpenAPIHono } from "@hono/zod-openapi";
import {
  openApiDocumentConfig,
  openApiGeneratorOptions,
} from "../../../openapi.js";

export const openApiJsonRoutePath = "/openapi.json";

type OpenApiDocumentProvider = () => unknown;

export function createOpenApiRouter(
  getOpenApiDocument: OpenApiDocumentProvider,
) {
  const router = new OpenAPIHono();

  router.get(openApiJsonRoutePath, (context) => {
    return context.json(getOpenApiDocument());
  });

  return router;
}

export function getOpenApiDocument(app: OpenAPIHono): unknown {
  return app.getOpenAPI31Document(
    openApiDocumentConfig,
    openApiGeneratorOptions,
  );
}
