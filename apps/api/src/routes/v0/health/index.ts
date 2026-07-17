import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import type { HealthResponse } from "@package/types";
import { HealthResponseSchema, jsonContent } from "../../../openapi.js";

const healthRoute = createRoute({
  method: "get",
  path: "/health",
  operationId: "getHealth",
  summary: "Check API health",
  tags: ["Health"],
  responses: {
    200: {
      description: "The API service is healthy.",
      content: jsonContent(HealthResponseSchema),
    },
  },
});

export function createHealthRouter() {
  const router = new OpenAPIHono();

  router.openapi(healthRoute, (context) => {
    return context.json(
      {
        ok: true,
        service: "api",
      } satisfies HealthResponse,
      200,
    );
  });

  return router;
}
