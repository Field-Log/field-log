import {
  createLogger,
  createProxyTransport,
  loggerValues,
} from "@package/logger";
import { clientEnv } from "@/env/client";

function createLogProxyUrl(apiUrl: string) {
  return `${apiUrl.replace(/\/+$/, "")}/api/v0/logs`;
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
  deploymentId: clientEnv.VITE_LOG_DEPLOYMENT_ID ?? import.meta.env.MODE,
  deploymentTarget: clientEnv.VITE_LOG_DEPLOYMENT_TARGET ?? "web-client",
  environment: import.meta.env.MODE,
  transports,
});
