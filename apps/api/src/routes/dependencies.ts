import type { Logger } from "@package/logger";
import type { Context } from "hono";

export const mobileUpdateSeverities = [
  "none",
  "recommended",
  "required",
] as const;

export type MobileUpdateSeverity = (typeof mobileUpdateSeverities)[number];

export type MobileVersionPolicy = {
  androidStoreUrl?: string;
  iosStoreUrl?: string;
  latestVersion?: string;
  minimumSupportedVersion?: string;
  severity: MobileUpdateSeverity;
};

export type AppRuntimeConfig = {
  clientLogKey?: string;
  logger?: Logger;
  mobileVersionPolicy?: MobileVersionPolicy;
};

export type AppDependencies = {
  clientLogKey?: string;
  getRuntimeConfig?: (
    context: Context,
  ) => AppRuntimeConfig | Promise<AppRuntimeConfig>;
  logger?: Logger;
  mobileVersionPolicy?: MobileVersionPolicy;
};

export async function getRuntimeConfig(
  context: Context,
  dependencies: AppDependencies,
): Promise<AppRuntimeConfig> {
  const runtimeConfig = await dependencies.getRuntimeConfig?.(context);

  return {
    clientLogKey: runtimeConfig?.clientLogKey ?? dependencies.clientLogKey,
    logger: runtimeConfig?.logger ?? dependencies.logger,
    mobileVersionPolicy:
      runtimeConfig?.mobileVersionPolicy ?? dependencies.mobileVersionPolicy,
  };
}

export async function getConfiguredLogger(): Promise<Logger> {
  const { s } = await import("../lib/services.js");

  return s.logger;
}
