import { serve } from "@hono/node-server";
import { loggerMessages } from "@package/logger";
import { createApp } from "./app.js";
import { readProcessScraperRuntimeEnv, scraperEnv } from "./env.js";
import { createScraperJobEnv } from "./env.schema.js";
import { createScraperLogger } from "./lib/logger.js";
import { type ScraperScheduler, startScraperScheduler } from "./scheduler.js";

const logger = createScraperLogger({
  appEnv: scraperEnv.APP_ENV,
  axiomDataset: scraperEnv.AXIOM_DATASET,
  axiomEdgeDomain: scraperEnv.AXIOM_EDGE_DOMAIN,
  axiomToken: scraperEnv.AXIOM_TOKEN,
  loggerMode: scraperEnv.LOGGER,
  logLevel: scraperEnv.LOG_LEVEL,
});

void main().catch(async (error) => {
  logger.fatal(loggerMessages.scraper.serverFailed, {
    attributes: {
      source: "server",
    },
    error,
  });
  await logger.flush();
  process.exitCode = 1;
});

async function main() {
  const scheduler = scraperEnv.SCRAPER_SCHEDULER_ENABLED
    ? await startScraperScheduler({
        env: createScraperJobEnv(readProcessScraperRuntimeEnv()),
        logger,
      })
    : undefined;
  const app = createApp({ logger });
  const server = serve({
    fetch: app.fetch,
    port: scraperEnv.PORT,
  });

  logger.info(loggerMessages.scraper.serverListening, {
    attributes: {
      port: scraperEnv.PORT,
      schedulerEnabled: scraperEnv.SCRAPER_SCHEDULER_ENABLED,
    },
  });

  process.once("SIGINT", () => {
    void shutdown({ scheduler, server, signal: "SIGINT" });
  });
  process.once("SIGTERM", () => {
    void shutdown({ scheduler, server, signal: "SIGTERM" });
  });
}

async function shutdown({
  scheduler,
  server,
  signal,
}: {
  scheduler: ScraperScheduler | undefined;
  server: unknown;
  signal: string;
}) {
  logger.info(loggerMessages.scraper.serverStopping, {
    attributes: {
      signal,
    },
  });

  await scheduler?.stop();
  await closeServer(server);
  await logger.flush();
}

async function closeServer(server: unknown) {
  if (!isClosableServer(server)) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    server.close((error?: Error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });
}

function isClosableServer(server: unknown): server is {
  close: (callback: (error?: Error) => void) => void;
} {
  return (
    typeof server === "object" &&
    server !== null &&
    "close" in server &&
    typeof server.close === "function"
  );
}
