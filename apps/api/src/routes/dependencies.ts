import type { Logger } from "@package/logger";
import type { Context } from "hono";

export type AppRuntimeConfig = {
  clientLogKey?: string;
  logger?: Logger;
};

export type AppDependencies = {
  clientLogKey?: string;
  getRuntimeConfig?: (
    context: Context,
  ) => AppRuntimeConfig | Promise<AppRuntimeConfig>;
  logger?: Logger;
};

export async function getRuntimeConfig(
  context: Context,
  dependencies: AppDependencies,
): Promise<AppRuntimeConfig> {
  const runtimeConfig = await dependencies.getRuntimeConfig?.(context);

  return {
    clientLogKey: runtimeConfig?.clientLogKey ?? dependencies.clientLogKey,
    logger: runtimeConfig?.logger ?? dependencies.logger,
  };
}

export async function getConfiguredLogger(): Promise<Logger> {
  const { s } = await import("../lib/services.js");

  return s.logger;
}
