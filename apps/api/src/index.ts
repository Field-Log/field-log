import { serve } from "@hono/node-server";
import app from "./app.js";

const defaultPort = 4006;
const port = Number.parseInt(process.env.PORT ?? String(defaultPort), 10);

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`API listening on http://localhost:${info.port}`);
  },
);
