import process from "node:process";
import {
  createAxiomTransport,
  createConsoleTransport,
  createLogger,
  type Logger,
  loggerMessages,
  loggerValues,
  normalizeConsoleTransportMode,
  normalizeLogLevel,
} from "@package/logger";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import { createWebClientEnv } from "./src/env/client.schema";
import { createWebServerEnv } from "./src/env/server.schema";

type MutableEnv = Record<string, string | undefined>;

function envValue(env: MutableEnv, key: string) {
  const value = env[key];

  return value === "" ? undefined : value;
}

function createWebBuildLogger(env: MutableEnv): Logger {
  const axiomDataset = envValue(env, "AXIOM_DATASET");
  const axiomToken = envValue(env, "AXIOM_TOKEN");

  return createLogger({
    app: loggerValues.apps.web,
    environment:
      envValue(env, "VERCEL_ENV") ?? envValue(env, "NODE_ENV") ?? "build",
    level: normalizeLogLevel(envValue(env, "LOG_LEVEL")),
    transports: [
      ...(axiomDataset !== undefined && axiomToken !== undefined
        ? [
            createAxiomTransport({
              dataset: axiomDataset,
              edgeDomain: envValue(env, "AXIOM_EDGE_DOMAIN"),
              token: axiomToken,
            }),
          ]
        : []),
      createConsoleTransport({
        mode: normalizeConsoleTransportMode(envValue(env, "LOGGER")),
      }),
    ],
  });
}

export function applyWebClientEnvAliases(env: MutableEnv = process.env) {
  const logProxyClientKey = envValue(env, "LOG_PROXY_CLIENT_KEY");
  const logProxyUrl = envValue(env, "LOG_PROXY_URL");

  if (
    envValue(env, "VITE_LOG_PROXY_CLIENT_KEY") === undefined &&
    logProxyClientKey !== undefined
  ) {
    env.VITE_LOG_PROXY_CLIENT_KEY = logProxyClientKey;
  }

  if (
    envValue(env, "VITE_LOG_PROXY_URL") === undefined &&
    logProxyUrl !== undefined
  ) {
    env.VITE_LOG_PROXY_URL = logProxyUrl;
  }
}

function normalizePreviewWorkerHost(value: string | undefined) {
  if (value === undefined) {
    return undefined;
  }

  const host = value.replace(/^https?:\/\//, "").split("/")[0];

  return host === "" ? undefined : host;
}

export async function applyVercelPreviewApiEnv(
  env: MutableEnv = process.env,
  logger: Logger = createWebBuildLogger(env),
) {
  if (envValue(env, "VERCEL_ENV") !== "preview") {
    return;
  }

  const pullRequestId = envValue(env, "VERCEL_GIT_PULL_REQUEST_ID");
  const workerHost = normalizePreviewWorkerHost(
    envValue(env, "API_PREVIEW_WORKER_HOST"),
  );

  if (pullRequestId === undefined || workerHost === undefined) {
    return;
  }

  const apiBaseUrl = `https://pr-${pullRequestId}-${workerHost}`;

  env.VITE_API_BASE_URL = apiBaseUrl;
  env.VITE_LOG_PROXY_URL = `${apiBaseUrl}/logs`;

  logger.info(loggerMessages.web.previewApiDerived, {
    attributes: {
      apiBaseUrl,
      logProxyUrl: env.VITE_LOG_PROXY_URL,
      pullRequestId,
      workerHost,
    },
    console: {
      mode: "verbose",
    },
  });
  await logger.flush();
}

export default defineConfig(async ({ mode }) => {
  const isTest = mode === "test";

  if (!isTest) {
    applyWebClientEnvAliases();
    await applyVercelPreviewApiEnv();

    createWebClientEnv({
      VITE_API_BASE_URL: process.env.VITE_API_BASE_URL,
      VITE_CLERK_PUBLISHABLE_KEY: process.env.VITE_CLERK_PUBLISHABLE_KEY,
      VITE_CLERK_SIGN_IN_URL: process.env.VITE_CLERK_SIGN_IN_URL,
      VITE_CLERK_SIGN_UP_URL: process.env.VITE_CLERK_SIGN_UP_URL,
      VITE_LOG_PROXY_CLIENT_KEY: process.env.VITE_LOG_PROXY_CLIENT_KEY,
      VITE_LOG_PROXY_URL: process.env.VITE_LOG_PROXY_URL,
    });
    createWebServerEnv({
      AXIOM_DATASET: process.env.AXIOM_DATASET,
      AXIOM_EDGE_DOMAIN: process.env.AXIOM_EDGE_DOMAIN,
      AXIOM_TOKEN: process.env.AXIOM_TOKEN,
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
      DATABASE_URL: process.env.DATABASE_URL,
      LOGGER: process.env.LOGGER,
      LOG_LEVEL: process.env.LOG_LEVEL,
    });
  }

  return {
    plugins: [
      tanstackStart(),
      ...(isTest ? [] : [nitro()]),
      react(),
      tailwindcss(),
    ],
    preview: {
      port: 4005,
      strictPort: true,
    },
    resolve: {
      alias: {
        "@": "/src",
      },
    },
    server: {
      port: 4005,
      strictPort: true,
    },
  };
});
