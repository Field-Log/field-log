import { createLogger, createProxyTransport } from "@repo/logger";

const logProxyUrl = import.meta.env.VITE_LOG_PROXY_URL;

const transports = logProxyUrl
  ? [
      createProxyTransport({
        clientKey: import.meta.env.VITE_LOG_PROXY_CLIENT_KEY,
        url: logProxyUrl,
      }),
    ]
  : [];

export const logger = createLogger({
  app: "web",
  environment: import.meta.env.MODE,
  transports,
});
