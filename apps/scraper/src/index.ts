import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { scraperEnv } from "./env.js";

const app = createApp();

serve({
  fetch: app.fetch,
  port: scraperEnv.PORT,
});
