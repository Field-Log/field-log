import type { HealthResponse, ServiceInfoResponse } from "@repo/types";
import { Hono } from "hono";

const app = new Hono();

app.get("/", (context) => {
  return context.json({
    name: "machinedpens-api",
    status: "ok",
  } satisfies ServiceInfoResponse);
});

app.get("/health", (context) => {
  return context.json({
    ok: true,
    service: "api",
  } satisfies HealthResponse);
});

export default app;
