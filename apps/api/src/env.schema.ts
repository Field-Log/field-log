import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export type ApiRuntimeEnv = {
  AXIOM_DATASET?: string;
  AXIOM_EDGE_DOMAIN?: string;
  AXIOM_TOKEN?: string;
  DATABASE_URL?: string;
  LOGGER?: string;
  LOG_LEVEL?: string;
  LOG_PROXY_CLIENT_KEY?: string;
  PORT?: string;
};

export function createApiEnv(runtimeEnv: ApiRuntimeEnv) {
  return createEnv({
    emptyStringAsUndefined: true,
    isServer: true,
    runtimeEnvStrict: {
      AXIOM_DATASET: runtimeEnv.AXIOM_DATASET,
      AXIOM_EDGE_DOMAIN: runtimeEnv.AXIOM_EDGE_DOMAIN,
      AXIOM_TOKEN: runtimeEnv.AXIOM_TOKEN,
      DATABASE_URL: runtimeEnv.DATABASE_URL,
      LOGGER: runtimeEnv.LOGGER,
      LOG_LEVEL: runtimeEnv.LOG_LEVEL,
      LOG_PROXY_CLIENT_KEY: runtimeEnv.LOG_PROXY_CLIENT_KEY,
      PORT: runtimeEnv.PORT,
    },
    server: {
      AXIOM_DATASET: z.string().min(1).optional(),
      AXIOM_EDGE_DOMAIN: z.string().min(1).optional(),
      AXIOM_TOKEN: z.string().min(1).optional(),
      DATABASE_URL: z.string().min(1).url(),
      LOGGER: z.enum(["compact", "verbose"]).optional(),
      LOG_LEVEL: z
        .enum(["trace", "debug", "verbose", "info", "warn", "error", "fatal"])
        .optional(),
      LOG_PROXY_CLIENT_KEY: z.string().min(1).optional(),
      PORT: z.coerce.number().int().min(1).max(65_535).default(4006),
    },
  });
}
