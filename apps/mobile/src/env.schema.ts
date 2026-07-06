import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export type MobileRuntimeEnv = {
  EXPO_PUBLIC_API_BASE_URL?: string;
  EXPO_PUBLIC_LOG_PROXY_CLIENT_KEY?: string;
  EXPO_PUBLIC_LOG_PROXY_URL?: string;
};

export function createMobileEnv(runtimeEnv: MobileRuntimeEnv) {
  return createEnv({
    client: {
      EXPO_PUBLIC_API_BASE_URL: z.string().min(1).url().optional(),
      EXPO_PUBLIC_LOG_PROXY_CLIENT_KEY: z.string().min(1).optional(),
      EXPO_PUBLIC_LOG_PROXY_URL: z.string().min(1).url().optional(),
    },
    clientPrefix: "EXPO_PUBLIC_",
    emptyStringAsUndefined: true,
    isServer: false,
    runtimeEnvStrict: {
      EXPO_PUBLIC_API_BASE_URL: runtimeEnv.EXPO_PUBLIC_API_BASE_URL,
      EXPO_PUBLIC_LOG_PROXY_CLIENT_KEY:
        runtimeEnv.EXPO_PUBLIC_LOG_PROXY_CLIENT_KEY,
      EXPO_PUBLIC_LOG_PROXY_URL: runtimeEnv.EXPO_PUBLIC_LOG_PROXY_URL,
    },
  });
}
