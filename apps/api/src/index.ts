import { serve } from "@hono/node-server";
import { loggerMessages } from "@repo/logger";
import app from "./app.js";
import { s } from "./lib/services.js";

const defaultPort = 4006;
const port = Number.parseInt(process.env.PORT ?? String(defaultPort), 10);

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    s.logger.info(loggerMessages.api.serverListening, {
      attributes: {
        port: info.port,
        url: `http://localhost:${info.port}`,
      },
    });
  },
);
