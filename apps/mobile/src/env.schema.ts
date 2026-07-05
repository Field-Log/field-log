import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export type MobileRuntimeEnv = {
  EXPO_PUBLIC_API_BASE_URL?: string;
};

export function createMobileEnv(runtimeEnv: MobileRuntimeEnv) {
  return createEnv({
    client: {
      EXPO_PUBLIC_API_BASE_URL: z.string().min(1).url().optional(),
    },
    clientPrefix: "EXPO_PUBLIC_",
    emptyStringAsUndefined: true,
    isServer: false,
    runtimeEnvStrict: {
      EXPO_PUBLIC_API_BASE_URL: runtimeEnv.EXPO_PUBLIC_API_BASE_URL,
    },
  });
}
