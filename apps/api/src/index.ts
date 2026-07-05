import { serve } from "@hono/node-server";
import app from "./app.js";
import { apiEnv } from "./env.js";

serve(
  {
    fetch: app.fetch,
    port: apiEnv.PORT,
  },
  (info) => {
    console.log(`API listening on http://localhost:${info.port}`);
  },
);
