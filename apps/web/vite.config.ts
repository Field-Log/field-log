import process from "node:process";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { createWebClientEnv } from "./src/env/client.schema";
import { createWebServerEnv } from "./src/env/server.schema";

export default defineConfig(({ mode }) => {
  if (mode !== "test") {
    createWebClientEnv({
      VITE_CLERK_PUBLISHABLE_KEY: process.env.VITE_CLERK_PUBLISHABLE_KEY,
      VITE_CLERK_SIGN_IN_URL: process.env.VITE_CLERK_SIGN_IN_URL,
      VITE_CLERK_SIGN_UP_URL: process.env.VITE_CLERK_SIGN_UP_URL,
    });
    createWebServerEnv({
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
      DATABASE_URL: process.env.DATABASE_URL,
    });
  }

  return {
    plugins: [tanstackStart(), react(), tailwindcss()],
    publicDir: "publics",
    resolve: {
      alias: {
        "@": "/src",
      },
    },
  };
});
