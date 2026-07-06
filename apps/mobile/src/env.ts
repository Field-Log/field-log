import { createMobileEnv } from "./env.schema";

declare const process: {
  env: {
    EXPO_PUBLIC_API_BASE_URL?: string;
    EXPO_PUBLIC_LOG_PROXY_CLIENT_KEY?: string;
    EXPO_PUBLIC_LOG_PROXY_URL?: string;
  };
};

export const mobileEnv = createMobileEnv({
  EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
  EXPO_PUBLIC_LOG_PROXY_CLIENT_KEY:
    process.env.EXPO_PUBLIC_LOG_PROXY_CLIENT_KEY,
  EXPO_PUBLIC_LOG_PROXY_URL: process.env.EXPO_PUBLIC_LOG_PROXY_URL,
});
