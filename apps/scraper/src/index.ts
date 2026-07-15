import { serve } from "@hono/node-server";
import { loggerMessages } from "@package/logger";
import { createApp } from "./app.js";
import { scraperEnv } from "./env.js";
import { createScraperLogger } from "./lib/logger.js";

const logger = createScraperLogger({
  appEnv: scraperEnv.APP_ENV,
  axiomDataset: scraperEnv.AXIOM_DATASET,
  axiomEdgeDomain: scraperEnv.AXIOM_EDGE_DOMAIN,
  axiomToken: scraperEnv.AXIOM_TOKEN,
  loggerMode: scraperEnv.LOGGER,
  logLevel: scraperEnv.LOG_LEVEL,
});
const app = createApp({ logger });

serve({
  fetch: app.fetch,
  port: scraperEnv.PORT,
});

logger.info(loggerMessages.scraper.serverListening, {
  attributes: {
    port: scraperEnv.PORT,
  },
});
