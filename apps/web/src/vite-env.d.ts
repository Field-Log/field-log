/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLERK_PUBLISHABLE_KEY?: string;
  readonly VITE_CLERK_SIGN_IN_URL?: string;
  readonly VITE_CLERK_SIGN_UP_URL?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_LOG_PROXY_CLIENT_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
