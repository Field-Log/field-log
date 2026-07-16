import { type Logger, loggerMessages } from "@package/logger";
import {
  runQueueProcessorJob,
  runSourceProducerJob,
  type ScraperJobContext,
  type ScraperJobEnv,
} from "./jobs.js";
import { scraperSources } from "./scraper-types.js";

type RecurringTaskDueInput = {
  intervalMinutes: number;
  lastRunAt: string | null;
  now: Date;
};

type RecurringTaskDueState = {
  due: boolean;
  lastRunAt?: string;
  minutesSinceLastRun?: number;
  nextRunAt?: string;
  reason:
    | "interval-elapsed"
    | "interval-not-elapsed"
    | "invalid-last-run"
    | "last-run-in-future"
    | "never-run";
};

const millisecondsPerMinute = 60_000;
const cronStateKeys = {
  autmogLastSuccess: `scraper:cron:last-success:${scraperSources.autmog}`,
} as const;

export async function runRailwayCronJob({
  context,
  env,
  logger,
  now = new Date(),
}: {
  context: ScraperJobContext;
  env: ScraperJobEnv;
  logger: Logger;
  now?: Date;
}) {
  const startedAt = Date.now();
  const failures: Error[] = [];

  logger.info(loggerMessages.scraper.cron.started, {
    attributes: {
      autmogIntervalMinutes: env.SCRAPER_AUTMOG_INTERVAL_MINUTES,
      queueProcessorIntervalMinutes:
        env.SCRAPER_QUEUE_PROCESSOR_INTERVAL_MINUTES,
      scheduledAt: now.toISOString(),
    },
  });

  await runAutmogWhenDue({ context, env, failures, logger, now });
  await runQueueProcessor({ context, env, failures, logger });

  const attributes = {
    durationMs: Date.now() - startedAt,
    failedTasks: failures.length,
    scheduledAt: now.toISOString(),
  };

  if (failures.length > 0) {
    logger.error(loggerMessages.scraper.cron.failed, {
      attributes,
      error: new AggregateError(failures, "Railway cron run failed."),
    });
    throw failures.length === 1
      ? failures[0]
      : new AggregateError(failures, "Railway cron run failed.");
  }

  logger.info(loggerMessages.scraper.cron.completed, {
    attributes,
  });
}

export function getRecurringTaskDueState({
  intervalMinutes,
  lastRunAt,
  now,
}: RecurringTaskDueInput): RecurringTaskDueState {
  if (!lastRunAt) {
    return {
      due: true,
      reason: "never-run",
    };
  }

  const lastRunDate = new Date(lastRunAt);

  if (Number.isNaN(lastRunDate.getTime())) {
    return {
      due: true,
      lastRunAt,
      reason: "invalid-last-run",
    };
  }

  const intervalMs = intervalMinutes * millisecondsPerMinute;
  const elapsedMs = now.getTime() - lastRunDate.getTime();
  const nextRunDate = new Date(lastRunDate.getTime() + intervalMs);

  if (elapsedMs < 0) {
    return {
      due: false,
      lastRunAt: lastRunDate.toISOString(),
      minutesSinceLastRun: Math.floor(elapsedMs / millisecondsPerMinute),
      nextRunAt: nextRunDate.toISOString(),
      reason: "last-run-in-future",
    };
  }

  const due = elapsedMs >= intervalMs;

  return {
    due,
    lastRunAt: lastRunDate.toISOString(),
    minutesSinceLastRun: Math.floor(elapsedMs / millisecondsPerMinute),
    nextRunAt: nextRunDate.toISOString(),
    reason: due ? "interval-elapsed" : "interval-not-elapsed",
  };
}

async function runAutmogWhenDue({
  context,
  env,
  failures,
  logger,
  now,
}: {
  context: ScraperJobContext;
  env: ScraperJobEnv;
  failures: Error[];
  logger: Logger;
  now: Date;
}) {
  const lastRunAt = await context.redis.get(cronStateKeys.autmogLastSuccess);
  const dueState = getRecurringTaskDueState({
    intervalMinutes: env.SCRAPER_AUTMOG_INTERVAL_MINUTES,
    lastRunAt,
    now,
  });
  const attributes = {
    ...dueState,
    intervalMinutes: env.SCRAPER_AUTMOG_INTERVAL_MINUTES,
    source: scraperSources.autmog,
    task: `scrape:${scraperSources.autmog}`,
  };

  if (!dueState.due) {
    logger.info(loggerMessages.scraper.cron.taskSkipped, {
      attributes,
    });
    return;
  }

  await runCronTask({
    attributes,
    logger,
    run: async () => {
      await runSourceProducerJob({
        context,
        logger,
        source: scraperSources.autmog,
      });
      await context.redis.set(
        cronStateKeys.autmogLastSuccess,
        now.toISOString(),
      );
    },
    failures,
  });
}

async function runQueueProcessor({
  context,
  env,
  failures,
  logger,
}: {
  context: ScraperJobContext;
  env: ScraperJobEnv;
  failures: Error[];
  logger: Logger;
}) {
  await runCronTask({
    attributes: {
      task: "process:queue",
    },
    failures,
    logger,
    run: () => runQueueProcessorJob({ context, env, logger }),
  });
}

async function runCronTask({
  attributes,
  failures,
  logger,
  run,
}: {
  attributes: Record<string, unknown>;
  failures: Error[];
  logger: Logger;
  run: () => Promise<void>;
}) {
  const startedAt = Date.now();

  logger.info(loggerMessages.scraper.cron.taskStarted, {
    attributes,
  });

  try {
    await run();
    logger.info(loggerMessages.scraper.cron.taskCompleted, {
      attributes: {
        ...attributes,
        durationMs: Date.now() - startedAt,
      },
    });
  } catch (error) {
    const normalizedError =
      error instanceof Error ? error : new Error(String(error));

    failures.push(normalizedError);
    logger.error(loggerMessages.scraper.cron.taskFailed, {
      attributes: {
        ...attributes,
        durationMs: Date.now() - startedAt,
      },
      error: normalizedError,
    });
  }
}
