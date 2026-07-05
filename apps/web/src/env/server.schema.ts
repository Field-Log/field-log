import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export type WebServerRuntimeEnv = {
  CLERK_SECRET_KEY?: string;
  DATABASE_URL?: string;
};

export function createWebServerEnv(runtimeEnv: WebServerRuntimeEnv) {
  return createEnv({
    emptyStringAsUndefined: true,
    isServer: true,
    runtimeEnvStrict: {
      CLERK_SECRET_KEY: runtimeEnv.CLERK_SECRET_KEY,
      DATABASE_URL: runtimeEnv.DATABASE_URL,
    },
    server: {
      CLERK_SECRET_KEY: z.string().min(1),
      DATABASE_URL: z.string().min(1).url(),
    },
  });
}
