import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export type WebServerRuntimeEnv = {
  AXIOM_DATASET?: string;
  AXIOM_EDGE_DOMAIN?: string;
  AXIOM_TOKEN?: string;
  CLERK_SECRET_KEY?: string;
  DATABASE_URL?: string;
  IMAGE_FOLDER_PREFIX?: string;
  LOGGER?: string;
  LOG_DEPLOYMENT_ID?: string;
  LOG_DEPLOYMENT_TARGET?: string;
  LOG_LEVEL?: string;
};

export function createWebServerEnv(runtimeEnv: WebServerRuntimeEnv) {
  return createEnv({
    emptyStringAsUndefined: true,
    isServer: true,
    runtimeEnvStrict: {
      AXIOM_DATASET: runtimeEnv.AXIOM_DATASET,
      AXIOM_EDGE_DOMAIN: runtimeEnv.AXIOM_EDGE_DOMAIN,
      AXIOM_TOKEN: runtimeEnv.AXIOM_TOKEN,
      CLERK_SECRET_KEY: runtimeEnv.CLERK_SECRET_KEY,
      DATABASE_URL: runtimeEnv.DATABASE_URL,
      IMAGE_FOLDER_PREFIX: runtimeEnv.IMAGE_FOLDER_PREFIX,
      LOGGER: runtimeEnv.LOGGER,
      LOG_DEPLOYMENT_ID: runtimeEnv.LOG_DEPLOYMENT_ID,
      LOG_DEPLOYMENT_TARGET: runtimeEnv.LOG_DEPLOYMENT_TARGET,
      LOG_LEVEL: runtimeEnv.LOG_LEVEL,
    },
    server: {
      AXIOM_DATASET: z.string().min(1).optional(),
      AXIOM_EDGE_DOMAIN: z.string().min(1).optional(),
      AXIOM_TOKEN: z.string().min(1).optional(),
      CLERK_SECRET_KEY: z.string().min(1),
      DATABASE_URL: z.string().min(1).url(),
      IMAGE_FOLDER_PREFIX: z.string().min(1).optional(),
      LOGGER: z.enum(["compact", "verbose"]).optional(),
      LOG_DEPLOYMENT_ID: z.string().min(1).optional(),
      LOG_DEPLOYMENT_TARGET: z.string().min(1).optional(),
      LOG_LEVEL: z
        .enum(["trace", "debug", "verbose", "info", "warn", "error", "fatal"])
        .optional(),
    },
  });
}
