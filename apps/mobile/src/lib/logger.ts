import {
  createLogger,
  createProxyTransport,
  loggerValues,
} from "@package/logger";
import { mobileEnv } from "../env";

function createLogProxyUrl(apiUrl: string) {
  return `${apiUrl.replace(/\/+$/, "")}/api/v1/logs`;
}

const logProxyUrl = mobileEnv.EXPO_PUBLIC_API_URL
  ? createLogProxyUrl(mobileEnv.EXPO_PUBLIC_API_URL)
  : undefined;

const transports = logProxyUrl
  ? [
      createProxyTransport({
        clientKey: mobileEnv.EXPO_PUBLIC_LOG_PROXY_CLIENT_KEY,
        url: logProxyUrl,
      }),
    ]
  : [];

export const logger = createLogger({
  app: loggerValues.apps.mobile,
  environment: __DEV__ ? "development" : "production",
  transports,
});
