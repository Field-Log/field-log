import { type Logger, loggerMessages } from "@package/logger";
import { runAutmogProducer } from "./autmog/producer.js";
import {
  createScraperDb,
  finishScraperRun,
  startScraperRun,
} from "./db/autmog.js";
import { readProcessScraperRuntimeEnv } from "./env.js";
import { createScraperJobEnv } from "./env.schema.js";
import { createImageStorage } from "./image/imagekit.js";
import { createScraperLogger } from "./lib/logger.js";
import { runQueueProcessor } from "./queue/processor.js";
import { createScraperQueues } from "./queue/queues.js";
import { createRedisConnection } from "./queue/redis.js";
import { scraperSources } from "./scraper-types.js";

type ScraperCommand = "process:queue" | "scrape:autmog";

async function main() {
  const command = parseCommand(process.argv[2]);
  const env = createScraperJobEnv(readProcessScraperRuntimeEnv());
  const logger = createScraperLogger({
    appEnv: env.APP_ENV,
    axiomDataset: env.AXIOM_DATASET,
    axiomEdgeDomain: env.AXIOM_EDGE_DOMAIN,
    axiomToken: env.AXIOM_TOKEN,
    loggerMode: env.LOGGER,
    logLevel: env.LOG_LEVEL,
  });
  const db = createScraperDb(env.DATABASE_URL);
  const connection = createRedisConnection(env.REDIS_URL);
  const queues = createScraperQueues(connection);

  try {
    if (command === "scrape:autmog") {
      await runLoggedCommand({
        command,
        execute: async () => {
          const result = await runAutmogProducer({ logger, queues });

          return {
            enqueuedItemJobs: result.enqueuedCount,
            fetchedCount: result.fetchedCount,
          };
        },
        jobType: "producer",
        logger,
        source: scraperSources.autmog,
        db,
      });
      return;
    }

    await runLoggedCommand({
      command,
      execute: async () => {
        const imageStorage = createImageStorage({
          dryRun: env.SCRAPER_DRY_RUN,
          privateKey: env.IMAGE_KIT_PRIVATE_KEY,
          publicKey: env.IMAGE_KIT_PUBLIC_KEY,
          urlEndpoint: env.IMAGE_KIT_URL_ENDPOINT,
        });
        const result = await runQueueProcessor({
          batchSize: {
            images: env.SCRAPER_IMAGE_BATCH_SIZE,
            items: env.SCRAPER_ITEM_BATCH_SIZE,
          },
          concurrency: env.SCRAPER_QUEUE_CONCURRENCY,
          connection,
          db,
          imageStorage,
          logger,
          queues,
        });

        return {
          failedImageJobs: result.images.failed,
          failedItemJobs: result.items.failed,
          processedImageJobs: result.images.completed,
          processedItemJobs: result.items.completed,
          skippedImageJobs: result.images.skipped,
        };
      },
      jobType: "processor",
      logger,
      source: "queue",
      db,
    });
  } finally {
    await queues.close();
    connection.disconnect();
    await logger.flush();
  }
}

async function runLoggedCommand({
  command,
  db,
  execute,
  jobType,
  logger,
  source,
}: {
  command: ScraperCommand;
  db: Parameters<typeof startScraperRun>[0];
  execute: () => Promise<Record<string, number | undefined>>;
  jobType: string;
  logger: Logger;
  source: string;
}) {
  const run = await startScraperRun(db, { jobType, source });
  const startedAt = Date.now();

  if (!run) {
    throw new Error(`Failed to create scraper run for ${source}:${jobType}.`);
  }

  logger.info(loggerMessages.scraper.run.started, {
    attributes: {
      command,
      jobType,
      runId: run.id,
      source,
    },
  });

  try {
    const stats = await execute();
    await finishScraperRun(db, run.id, {
      stats,
      status: "completed",
    });
    logger.info(loggerMessages.scraper.run.completed, {
      attributes: {
        ...stats,
        command,
        durationMs: Date.now() - startedAt,
        jobType,
        runId: run.id,
        source,
      },
    });
  } catch (error) {
    await finishScraperRun(db, run.id, {
      errorMessage: error instanceof Error ? error.message : String(error),
      status: "failed",
    });
    logger.error(loggerMessages.scraper.run.failed, {
      attributes: {
        command,
        durationMs: Date.now() - startedAt,
        jobType,
        runId: run.id,
        source,
      },
      error,
    });
    throw error;
  }
}

function parseCommand(value: string | undefined): ScraperCommand {
  if (value === "process:queue" || value === "scrape:autmog") {
    return value;
  }

  throw new Error(
    `Unknown scraper command "${value ?? ""}". Expected scrape:autmog or process:queue.`,
  );
}

void main().catch(() => {
  process.exitCode = 1;
});
