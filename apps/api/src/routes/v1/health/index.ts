import type { HealthResponse } from "@package/types";
import { Hono } from "hono";

export function createHealthRouter() {
  const router = new Hono();

  router.get("/health", (context) => {
    return context.json({
      ok: true,
      service: "api",
    } satisfies HealthResponse);
  });

  return router;
}
