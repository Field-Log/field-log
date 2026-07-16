import { randomUUID } from "node:crypto";
import { type Logger, loggerMessages } from "@package/logger";
import {
  createScraperJobContext,
  runAutmogProducerJob,
  runQueueProcessorJob,
  type ScraperJobContext,
  type ScraperJobEnv,
} from "./jobs.js";
import { scraperSources } from "./scraper-types.js";

type ScheduledTask = {
  intervalMs: number;
  lockKey: string;
  lockTtlMs: number;
  name: string;
  run: () => Promise<void>;
  startDelayMs: number;
  timer?: ReturnType<typeof setTimeout>;
};

export type ScraperScheduler = {
  stop: () => Promise<void>;
};

const millisecondsPerSecond = 1_000;
const millisecondsPerMinute = 60 * millisecondsPerSecond;

export async function startScraperScheduler({
  env,
  logger,
}: {
  env: ScraperJobEnv;
  logger: Logger;
}): Promise<ScraperScheduler> {
  const context = await createScraperJobContext(env);
  const tasks: ScheduledTask[] = [
    {
      intervalMs: env.SCRAPER_AUTMOG_INTERVAL_MINUTES * millisecondsPerMinute,
      lockKey: `scraper:scheduler:${scraperSources.autmog}`,
      lockTtlMs:
        env.SCRAPER_AUTMOG_INTERVAL_MINUTES * millisecondsPerMinute * 2,
      name: scraperSources.autmog,
      run: () => runAutmogProducerJob({ context, logger }),
      startDelayMs:
        env.SCRAPER_AUTMOG_START_DELAY_SECONDS * millisecondsPerSecond,
    },
    {
      intervalMs:
        env.SCRAPER_QUEUE_PROCESSOR_INTERVAL_MINUTES * millisecondsPerMinute,
      lockKey: "scraper:scheduler:queue-processor",
      lockTtlMs:
        env.SCRAPER_QUEUE_PROCESSOR_INTERVAL_MINUTES *
        millisecondsPerMinute *
        2,
      name: "queue-processor",
      run: () => runQueueProcessorJob({ context, env, logger }),
      startDelayMs:
        env.SCRAPER_QUEUE_PROCESSOR_START_DELAY_SECONDS * millisecondsPerSecond,
    },
  ];
  let stopped = false;

  logger.info(loggerMessages.scraper.scheduler.started, {
    attributes: {
      autmogIntervalMinutes: env.SCRAPER_AUTMOG_INTERVAL_MINUTES,
      autmogStartDelaySeconds: env.SCRAPER_AUTMOG_START_DELAY_SECONDS,
      queueProcessorIntervalMinutes:
        env.SCRAPER_QUEUE_PROCESSOR_INTERVAL_MINUTES,
      queueProcessorStartDelaySeconds:
        env.SCRAPER_QUEUE_PROCESSOR_START_DELAY_SECONDS,
    },
  });

  for (const task of tasks) {
    scheduleNext(task, task.startDelayMs);
  }

  return {
    async stop() {
      stopped = true;

      for (const task of tasks) {
        if (task.timer) {
          clearTimeout(task.timer);
        }
      }

      await context.close();
      logger.info(loggerMessages.scraper.scheduler.stopped);
    },
  };

  function scheduleNext(task: ScheduledTask, delayMs = task.intervalMs) {
    if (stopped) {
      return;
    }

    task.timer = setTimeout(() => {
      void runScheduledTask({ context, logger, task })
        .catch(() => undefined)
        .finally(() => scheduleNext(task));
    }, delayMs);
  }
}

async function runScheduledTask({
  context,
  logger,
  task,
}: {
  context: ScraperJobContext;
  logger: Logger;
  task: ScheduledTask;
}) {
  const startedAt = Date.now();

  try {
    await withRedisLock({
      context,
      logger,
      lockKey: task.lockKey,
      lockTtlMs: task.lockTtlMs,
      taskName: task.name,
      run: async () => {
        logger.info(loggerMessages.scraper.scheduler.taskStarted, {
          attributes: {
            task: task.name,
          },
        });

        await task.run();
        logger.info(loggerMessages.scraper.scheduler.taskCompleted, {
          attributes: {
            durationMs: Date.now() - startedAt,
            task: task.name,
          },
        });
      },
    });
  } catch (error) {
    logger.error(loggerMessages.scraper.scheduler.taskFailed, {
      attributes: {
        durationMs: Date.now() - startedAt,
        task: task.name,
      },
      error,
    });
  }
}

async function withRedisLock({
  context,
  logger,
  lockKey,
  lockTtlMs,
  run,
  taskName,
}: {
  context: ScraperJobContext;
  logger: Logger;
  lockKey: string;
  lockTtlMs: number;
  run: () => Promise<void>;
  taskName: string;
}) {
  const token = randomUUID();
  const acquired = await context.redis.set(
    lockKey,
    token,
    "PX",
    lockTtlMs,
    "NX",
  );

  if (acquired !== "OK") {
    logger.info(loggerMessages.scraper.scheduler.lockSkipped, {
      attributes: {
        lockKey,
        task: taskName,
      },
    });
    return;
  }

  try {
    await run();
  } finally {
    await context.redis.eval(
      "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
      1,
      lockKey,
      token,
    );
  }
}
