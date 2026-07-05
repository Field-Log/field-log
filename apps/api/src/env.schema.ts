import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export type ApiRuntimeEnv = {
  DATABASE_URL?: string;
  PORT?: string;
};

export function createApiEnv(runtimeEnv: ApiRuntimeEnv) {
  return createEnv({
    emptyStringAsUndefined: true,
    isServer: true,
    runtimeEnvStrict: {
      DATABASE_URL: runtimeEnv.DATABASE_URL,
      PORT: runtimeEnv.PORT,
    },
    server: {
      DATABASE_URL: z.string().min(1).url(),
      PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
    },
  });
}
