import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export type DatabaseRuntimeEnv = {
  DATABASE_URL?: string;
};

export function createDatabaseEnv(runtimeEnv: DatabaseRuntimeEnv) {
  return createEnv({
    emptyStringAsUndefined: true,
    isServer: true,
    runtimeEnvStrict: {
      DATABASE_URL: runtimeEnv.DATABASE_URL,
    },
    server: {
      DATABASE_URL: z.string().min(1).url().optional(),
    },
  });
}
