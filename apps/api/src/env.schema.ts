import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";
import type { MobileVersionPolicy } from "./routes/dependencies.js";
import { mobileUpdateSeverities } from "./routes/dependencies.js";

export type ApiRuntimeEnv = {
  APP_ENV?: string;
  AXIOM_DATASET?: string;
  AXIOM_EDGE_DOMAIN?: string;
  AXIOM_TOKEN?: string;
  DATABASE_URL?: string;
  LOGGER?: string;
  LOG_LEVEL?: string;
  LOG_PROXY_CLIENT_KEY?: string;
  MOBILE_ANDROID_STORE_URL?: string;
  MOBILE_IOS_STORE_URL?: string;
  MOBILE_LATEST_VERSION?: string;
  MOBILE_MIN_SUPPORTED_VERSION?: string;
  MOBILE_UPDATE_SEVERITY?: string;
  PORT?: string;
};

const mobileUpdateSeveritySchema = z.enum(mobileUpdateSeverities);

export function createApiEnv(runtimeEnv: ApiRuntimeEnv) {
  return createEnv({
    emptyStringAsUndefined: true,
    isServer: true,
    runtimeEnvStrict: {
      APP_ENV: runtimeEnv.APP_ENV,
      AXIOM_DATASET: runtimeEnv.AXIOM_DATASET,
      AXIOM_EDGE_DOMAIN: runtimeEnv.AXIOM_EDGE_DOMAIN,
      AXIOM_TOKEN: runtimeEnv.AXIOM_TOKEN,
      DATABASE_URL: runtimeEnv.DATABASE_URL,
      LOGGER: runtimeEnv.LOGGER,
      LOG_LEVEL: runtimeEnv.LOG_LEVEL,
      LOG_PROXY_CLIENT_KEY: runtimeEnv.LOG_PROXY_CLIENT_KEY,
      MOBILE_ANDROID_STORE_URL: runtimeEnv.MOBILE_ANDROID_STORE_URL,
      MOBILE_IOS_STORE_URL: runtimeEnv.MOBILE_IOS_STORE_URL,
      MOBILE_LATEST_VERSION: runtimeEnv.MOBILE_LATEST_VERSION,
      MOBILE_MIN_SUPPORTED_VERSION: runtimeEnv.MOBILE_MIN_SUPPORTED_VERSION,
      MOBILE_UPDATE_SEVERITY: runtimeEnv.MOBILE_UPDATE_SEVERITY,
      PORT: runtimeEnv.PORT,
    },
    server: {
      APP_ENV: z.string().min(1).optional(),
      AXIOM_DATASET: z.string().min(1).optional(),
      AXIOM_EDGE_DOMAIN: z.string().min(1).optional(),
      AXIOM_TOKEN: z.string().min(1).optional(),
      DATABASE_URL: z.string().min(1).url(),
      LOGGER: z.enum(["compact", "verbose"]).optional(),
      LOG_LEVEL: z
        .enum(["trace", "debug", "verbose", "info", "warn", "error", "fatal"])
        .optional(),
      LOG_PROXY_CLIENT_KEY: z.string().min(1).optional(),
      MOBILE_ANDROID_STORE_URL: z.string().min(1).url().optional(),
      MOBILE_IOS_STORE_URL: z.string().min(1).url().optional(),
      MOBILE_LATEST_VERSION: z.string().min(1).optional(),
      MOBILE_MIN_SUPPORTED_VERSION: z.string().min(1).optional(),
      MOBILE_UPDATE_SEVERITY: mobileUpdateSeveritySchema.default("none"),
      PORT: z.coerce.number().int().min(1).max(65_535).default(4006),
    },
  });
}

export function createMobileVersionPolicyFromApiEnv(
  apiEnv: ReturnType<typeof createApiEnv>,
): MobileVersionPolicy {
  return {
    androidStoreUrl: apiEnv.MOBILE_ANDROID_STORE_URL,
    iosStoreUrl: apiEnv.MOBILE_IOS_STORE_URL,
    latestVersion: apiEnv.MOBILE_LATEST_VERSION,
    minimumSupportedVersion: apiEnv.MOBILE_MIN_SUPPORTED_VERSION,
    severity: apiEnv.MOBILE_UPDATE_SEVERITY,
  };
}
