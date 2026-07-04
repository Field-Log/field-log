import { createLogger, createProxyTransport, loggerValues } from "@repo/logger";

const logProxyUrl = process.env.EXPO_PUBLIC_LOG_PROXY_URL;

const transports = logProxyUrl
  ? [
      createProxyTransport({
        clientKey: process.env.EXPO_PUBLIC_LOG_PROXY_CLIENT_KEY,
        url: logProxyUrl,
      }),
    ]
  : [];

export const logger = createLogger({
  app: loggerValues.apps.mobile,
  environment: __DEV__ ? "development" : "production",
  transports,
});
