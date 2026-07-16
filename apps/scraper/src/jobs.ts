import type { Database } from "@package/database";
import { type Logger, loggerMessages } from "@package/logger";
import { createServices, type ImagesService } from "@package/services";
import { runAutmogProducer } from "./autmog/producer.js";
import {
  createScraperDb,
  finishScraperRun,
  startScraperRun,
} from "./db/autmog.js";
import type { createScraperJobEnv } from "./env.schema.js";
import {
  runQueueDeadLetterProcessor,
  runQueueProcessor,
} from "./queue/processor.js";
import { createScraperQueues, type ScraperQueues } from "./queue/queues.js";
import { createRedisConnection } from "./queue/redis.js";
import { type ScraperSourceName, scraperSources } from "./scraper-types.js";

export type ScraperJobEnv = ReturnType<typeof createScraperJobEnv>;

export const scraperSourceKeys = Object.values(scraperSources);

export type ScraperJobContext = {
  close: () => Promise<void>;
  db: Database;
  imageStorage: ImagesService;
  redis: ReturnType<typeof createRedisConnection>;
  queues: ScraperQueues;
};

export async function createScraperJobContext(
  env: ScraperJobEnv,
  logger: Logger,
): Promise<ScraperJobContext> {
  const db = createScraperDb(env.DATABASE_URL);
  const redis = createRedisConnection(env.REDIS_URL);
  const queues = createScraperQueues(redis);
  const services = createServices();
  services.configure({
    images: {
      dryRun: env.SCRAPER_DRY_RUN,
      privateKey: env.IMAGE_KIT_PRIVATE_KEY,
      publicKey: env.IMAGE_KIT_PUBLIC_KEY,
      urlEndpoint: env.IMAGE_KIT_URL_ENDPOINT,
    },
    logger,
  });

  await redis.ping();

  return {
    async close() {
      await queues.close();
      redis.disconnect();
    },
    db,
    imageStorage: services.images,
    queues,
    redis,
  };
}

export async function runAutmogProducerJob({
  context,
  logger,
}: {
  context: ScraperJobContext;
  logger: Logger;
}) {
  await runLoggedCommand({
    command: "scrape:autmog",
    db: context.db,
    execute: async () => {
      const result = await runAutmogProducer({
        logger,
        queues: context.queues,
      });

      return {
        enqueuedItemJobs: result.enqueuedCount,
        fetchedCount: result.fetchedCount,
      };
    },
    jobType: "producer",
    logger,
    source: scraperSources.autmog,
  });
}

export async function runSourceProducerJob({
  context,
  logger,
  source,
}: {
  context: ScraperJobContext;
  logger: Logger;
  source: ScraperSourceName;
}) {
  if (source === scraperSources.autmog) {
    await runAutmogProducerJob({ context, logger });
    return;
  }

  throw new Error(`Scraper source "${source}" is not implemented yet.`);
}

export async function runQueueProcessorJob({
  context,
  env,
  logger,
}: {
  context: ScraperJobContext;
  env: ScraperJobEnv;
  logger: Logger;
}) {
  await runLoggedCommand({
    command: "process:queue",
    db: context.db,
    execute: async () => {
      const result = await runQueueProcessor({
        batchSize: {
          images: env.SCRAPER_IMAGE_BATCH_SIZE,
          items: env.SCRAPER_ITEM_BATCH_SIZE,
        },
        concurrency: env.SCRAPER_QUEUE_CONCURRENCY,
        connection: context.redis,
        db: context.db,
        imageStorage: context.imageStorage,
        logger,
        queues: context.queues,
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
  });
}

export async function runQueueDeadLetterProcessorJob({
  context,
  env,
  logger,
}: {
  context: ScraperJobContext;
  env: ScraperJobEnv;
  logger: Logger;
}) {
  await runLoggedCommand({
    command: "process:dead-letter",
    db: context.db,
    execute: async () => {
      const result = await runQueueDeadLetterProcessor({
        batchSize: {
          images: env.SCRAPER_IMAGE_BATCH_SIZE,
          items: env.SCRAPER_ITEM_BATCH_SIZE,
        },
        logger,
        queues: context.queues,
      });

      return {
        deadLetterFailedImageJobs: result.images.failed,
        deadLetterFailedItemJobs: result.items.failed,
        deadLetterRequeueFailedImageJobs: result.images.requeueFailed,
        deadLetterRequeueFailedItemJobs: result.items.requeueFailed,
        deadLetterRequeuedImageJobs: result.images.requeued,
        deadLetterRequeuedItemJobs: result.items.requeued,
      };
    },
    jobType: "dead-letter-processor",
    logger,
    source: "queue",
  });
}

async function runLoggedCommand({
  command,
  db,
  execute,
  jobType,
  logger,
  source,
}: {
  command:
    | "process:dead-letter"
    | "process:queue"
    | `scrape:${ScraperSourceName}`;
  db: Database;
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
