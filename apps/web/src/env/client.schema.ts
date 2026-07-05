import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export type WebClientRuntimeEnv = {
  VITE_CLERK_PUBLISHABLE_KEY?: string;
  VITE_CLERK_SIGN_IN_URL?: string;
  VITE_CLERK_SIGN_UP_URL?: string;
};

export function createWebClientEnv(runtimeEnv: WebClientRuntimeEnv) {
  return createEnv({
    client: {
      VITE_CLERK_PUBLISHABLE_KEY: z.string().min(1),
      VITE_CLERK_SIGN_IN_URL: z.string().min(1),
      VITE_CLERK_SIGN_UP_URL: z.string().min(1),
    },
    clientPrefix: "VITE_",
    emptyStringAsUndefined: true,
    runtimeEnvStrict: {
      VITE_CLERK_PUBLISHABLE_KEY: runtimeEnv.VITE_CLERK_PUBLISHABLE_KEY,
      VITE_CLERK_SIGN_IN_URL: runtimeEnv.VITE_CLERK_SIGN_IN_URL,
      VITE_CLERK_SIGN_UP_URL: runtimeEnv.VITE_CLERK_SIGN_UP_URL,
    },
  });
}
