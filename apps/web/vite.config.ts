import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tanstackStart(), react(), tailwindcss()],
  preview: {
    port: 4005,
    strictPort: true,
  },
  publicDir: "publics",
  resolve: {
    alias: {
      "@": "/src",
    },
  },
  server: {
    port: 4005,
    strictPort: true,
  },
});
