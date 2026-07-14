import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export type MobileRuntimeEnv = {
  EXPO_PUBLIC_API_URL?: string;
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY?: string;
  EXPO_PUBLIC_LOG_PROXY_CLIENT_KEY?: string;
};

function normalizeUrl(value: string) {
  if (/^https?:\/\//.test(value)) {
    return value;
  }

  const protocol = /^(localhost|127\.0\.0\.1|\[::1\])(?::|$)/.test(value)
    ? "http"
    : "https";

  return `${protocol}://${value}`;
}

const urlSchema = z
  .string()
  .min(1)
  .transform(normalizeUrl)
  .pipe(z.string().url());

export function createMobileEnv(runtimeEnv: MobileRuntimeEnv) {
  return createEnv({
    client: {
      EXPO_PUBLIC_API_URL: urlSchema.optional(),
      EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
      EXPO_PUBLIC_LOG_PROXY_CLIENT_KEY: z.string().min(1).optional(),
    },
    clientPrefix: "EXPO_PUBLIC_",
    emptyStringAsUndefined: true,
    isServer: false,
    runtimeEnvStrict: {
      EXPO_PUBLIC_API_URL: runtimeEnv.EXPO_PUBLIC_API_URL,
      EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY:
        runtimeEnv.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
      EXPO_PUBLIC_LOG_PROXY_CLIENT_KEY:
        runtimeEnv.EXPO_PUBLIC_LOG_PROXY_CLIENT_KEY,
    },
  });
}
