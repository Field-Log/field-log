/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLERK_PUBLISHABLE_KEY?: string;
  readonly VITE_CLERK_SIGN_IN_URL?: string;
  readonly VITE_CLERK_SIGN_UP_URL?: string;
  readonly VITE_LOG_PROXY_CLIENT_KEY?: string;
  readonly VITE_LOG_PROXY_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
