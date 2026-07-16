import { Hono } from "hono";
import type { AppDependencies } from "../dependencies.js";
import { createHealthRouter } from "./health/index.js";
import { createLogsRouter } from "./logs/index.js";
import { createMobileVersionRouter } from "./mobile-version/index.js";

export const apiV0Prefix = "/api/v0";

export function createApiV0Router(dependencies: AppDependencies = {}) {
  const router = new Hono();

  router.route("/", createHealthRouter());
  router.route("/", createLogsRouter(dependencies));
  router.route("/", createMobileVersionRouter(dependencies));

  return router;
}
