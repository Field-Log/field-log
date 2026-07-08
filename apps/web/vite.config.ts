import process from "node:process";
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

export default defineConfig(({ mode }) => {
  const isTest = mode === "test";

  if (!isTest) {
    applyWebClientEnvAliases();

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
