import {
  createLogger,
  createProxyTransport,
  loggerValues,
} from "@package/logger";
import { clientEnv } from "@/env/client";

function createLogProxyUrl(apiUrl: string) {
  return `${apiUrl.replace(/\/+$/, "")}/logs`;
}

const logProxyUrl = clientEnv.VITE_API_URL
  ? createLogProxyUrl(clientEnv.VITE_API_URL)
  : undefined;

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
