import { createWebClientEnv } from "./client.schema";

export const clientEnv = createWebClientEnv({
  VITE_CLERK_PUBLISHABLE_KEY: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
  VITE_CLERK_SIGN_IN_URL: import.meta.env.VITE_CLERK_SIGN_IN_URL,
  VITE_CLERK_SIGN_UP_URL: import.meta.env.VITE_CLERK_SIGN_UP_URL,
  VITE_LOG_PROXY_CLIENT_KEY: import.meta.env.VITE_LOG_PROXY_CLIENT_KEY,
  VITE_LOG_PROXY_URL: import.meta.env.VITE_LOG_PROXY_URL,
});
