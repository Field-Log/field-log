import { createLogger, createProxyTransport, loggerValues } from "@repo/logger";
import { clientEnv } from "@/env/client";

const logProxyUrl = clientEnv.VITE_LOG_PROXY_URL;

const transports = logProxyUrl
  ? [
      createProxyTransport({
        clientKey: clientEnv.VITE_LOG_PROXY_CLIENT_KEY,
        url: logProxyUrl,
      }),
    ]
  : [];

export const logger = createLogger({
  app: loggerValues.apps.web,
  environment: import.meta.env.MODE,
  transports,
});
