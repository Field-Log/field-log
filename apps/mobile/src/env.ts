import { createMobileEnv } from "./env.schema";

declare const process: {
  env: {
    EXPO_PUBLIC_API_URL?: string;
    EXPO_PUBLIC_LOG_PROXY_CLIENT_KEY?: string;
  };
};

export const mobileEnv = createMobileEnv({
  EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL,
  EXPO_PUBLIC_LOG_PROXY_CLIENT_KEY:
    process.env.EXPO_PUBLIC_LOG_PROXY_CLIENT_KEY,
});
