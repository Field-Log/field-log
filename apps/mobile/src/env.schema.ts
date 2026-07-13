import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export type MobileRuntimeEnv = {
  EXPO_PUBLIC_FIREBASE_API_KEY?: string;
  EXPO_PUBLIC_FIREBASE_APP_ID?: string;
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN?: string;
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?: string;
  EXPO_PUBLIC_FIREBASE_PROJECT_ID?: string;
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET?: string;
  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?: string;
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?: string;
  EXPO_PUBLIC_API_URL?: string;
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
      EXPO_PUBLIC_FIREBASE_API_KEY: z.string().min(1).optional(),
      EXPO_PUBLIC_FIREBASE_APP_ID: z.string().min(1).optional(),
      EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1).optional(),
      EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1).optional(),
      EXPO_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1).optional(),
      EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1).optional(),
      EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: z.string().min(1).optional(),
      EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: z.string().min(1).optional(),
      EXPO_PUBLIC_API_URL: urlSchema.optional(),
      EXPO_PUBLIC_LOG_PROXY_CLIENT_KEY: z.string().min(1).optional(),
    },
    clientPrefix: "EXPO_PUBLIC_",
    emptyStringAsUndefined: true,
    isServer: false,
    runtimeEnvStrict: {
      EXPO_PUBLIC_FIREBASE_API_KEY: runtimeEnv.EXPO_PUBLIC_FIREBASE_API_KEY,
      EXPO_PUBLIC_FIREBASE_APP_ID: runtimeEnv.EXPO_PUBLIC_FIREBASE_APP_ID,
      EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN:
        runtimeEnv.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
        runtimeEnv.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      EXPO_PUBLIC_FIREBASE_PROJECT_ID:
        runtimeEnv.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET:
        runtimeEnv.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID:
        runtimeEnv.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID:
        runtimeEnv.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      EXPO_PUBLIC_API_URL: runtimeEnv.EXPO_PUBLIC_API_URL,
      EXPO_PUBLIC_LOG_PROXY_CLIENT_KEY:
        runtimeEnv.EXPO_PUBLIC_LOG_PROXY_CLIENT_KEY,
    },
  });
}
