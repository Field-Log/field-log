import { createMobileEnv } from "./env.schema";

declare const process: {
  env: {
    EXPO_PUBLIC_API_BASE_URL?: string;
  };
};

export const mobileEnv = createMobileEnv({
  EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
});
