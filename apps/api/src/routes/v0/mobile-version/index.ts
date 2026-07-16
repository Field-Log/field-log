import { Hono } from "hono";
import { type AppDependencies, getRuntimeConfig } from "../../dependencies.js";

export function createMobileVersionRouter(dependencies: AppDependencies = {}) {
  const router = new Hono();

  router.get("/mobile-version", async (context) => {
    const runtimeConfig = await getRuntimeConfig(context, dependencies);
    const policy = runtimeConfig.mobileVersionPolicy ?? { severity: "none" };

    return context.json({
      androidStoreUrl: policy.androidStoreUrl ?? null,
      iosStoreUrl: policy.iosStoreUrl ?? null,
      latestVersion: policy.latestVersion ?? null,
      minimumSupportedVersion: policy.minimumSupportedVersion ?? null,
      severity: policy.severity,
    });
  });

  return router;
}
