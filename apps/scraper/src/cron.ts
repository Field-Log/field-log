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

type CronTaskFailure = {
  attributes: Record<string, unknown>;
  error: Error;
};

const millisecondsPerMinute = 60_000;
const cronStateKeys = {
  autmogLastSuccess: `scraper:cron:last-success:${scraperSources.autmog}`,
  grimsmoFjellLastSuccess: `scraper:cron:last-success:${scraperSources.grimsmoFjell}`,
  grimsmoNorsemanLastSuccess: `scraper:cron:last-success:${scraperSources.grimsmoNorseman}`,
  grimsmoRaskLastSuccess: `scraper:cron:last-success:${scraperSources.grimsmoRask}`,
  grimsmoSagaLastSuccess: `scraper:cron:last-success:${scraperSources.grimsmoSaga}`,
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
  const failures: CronTaskFailure[] = [];

  logger.info(loggerMessages.scraper.cron.started, {
    attributes: {
      autmogIntervalMinutes: env.SCRAPER_AUTMOG_INTERVAL_MINUTES,
      grimsmoIntervalMinutes: env.SCRAPER_GRIMSMO_INTERVAL_MINUTES,
      imageFolderPrefix: context.imageFolderPrefix,
      queueProcessorIntervalMinutes:
        env.SCRAPER_QUEUE_PROCESSOR_INTERVAL_MINUTES,
      scheduledAt: now.toISOString(),
    },
  });

  await runAutmogWhenDue({ context, env, failures, logger, now });
  await runGrimsmoWhenDue({
    context,
    env,
    failures,
    logger,
    now,
    redisKey: cronStateKeys.grimsmoSagaLastSuccess,
    source: scraperSources.grimsmoSaga,
    startDelaySeconds: env.SCRAPER_GRIMSMO_SAGA_START_DELAY_SECONDS,
  });
  await runGrimsmoWhenDue({
    context,
    env,
    failures,
    logger,
    now,
    redisKey: cronStateKeys.grimsmoRaskLastSuccess,
    source: scraperSources.grimsmoRask,
    startDelaySeconds: env.SCRAPER_GRIMSMO_RASK_START_DELAY_SECONDS,
  });
  await runGrimsmoWhenDue({
    context,
    env,
    failures,
    logger,
    now,
    redisKey: cronStateKeys.grimsmoFjellLastSuccess,
    source: scraperSources.grimsmoFjell,
    startDelaySeconds: env.SCRAPER_GRIMSMO_FJELL_START_DELAY_SECONDS,
  });
  await runGrimsmoWhenDue({
    context,
    env,
    failures,
    logger,
    now,
    redisKey: cronStateKeys.grimsmoNorsemanLastSuccess,
    source: scraperSources.grimsmoNorseman,
    startDelaySeconds: env.SCRAPER_GRIMSMO_NORSEMAN_START_DELAY_SECONDS,
  });
  await runQueueProcessor({ context, env, failures, logger });

  const attributes = {
    durationMs: Date.now() - startedAt,
    failedTasks: failures.length,
    scheduledAt: now.toISOString(),
  };

  if (failures.length > 0) {
    logger.error(loggerMessages.scraper.cron.failed, {
      attributes: {
        ...attributes,
        failures: failures.map(formatCronTaskFailure),
      },
      error: new AggregateError(
        failures.map((failure) => failure.error),
        "Railway cron run failed.",
      ),
    });
    return;
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
  failures: CronTaskFailure[];
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
        env,
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

async function runGrimsmoWhenDue({
  context,
  env,
  failures,
  logger,
  now,
  redisKey,
  source,
  startDelaySeconds,
}: {
  context: ScraperJobContext;
  env: ScraperJobEnv;
  failures: CronTaskFailure[];
  logger: Logger;
  now: Date;
  redisKey: string;
  source:
    | typeof scraperSources.grimsmoFjell
    | typeof scraperSources.grimsmoNorseman
    | typeof scraperSources.grimsmoRask
    | typeof scraperSources.grimsmoSaga;
  startDelaySeconds: number;
}) {
  const lastRunAt = await context.redis.get(redisKey);
  const secondsIntoHour = now.getUTCMinutes() * 60 + now.getUTCSeconds();
  const firstRunWaitsForOffset =
    !lastRunAt && secondsIntoHour < startDelaySeconds;
  const shiftedNow = new Date(now.getTime() - startDelaySeconds * 1_000);
  const dueState = getRecurringTaskDueState({
    intervalMinutes: env.SCRAPER_GRIMSMO_INTERVAL_MINUTES,
    lastRunAt,
    now: shiftedNow,
  });
  const attributes = {
    ...dueState,
    intervalMinutes: env.SCRAPER_GRIMSMO_INTERVAL_MINUTES,
    source,
    startDelaySeconds,
    task: `scrape:${source}`,
  };

  if (!dueState.due || firstRunWaitsForOffset) {
    logger.info(loggerMessages.scraper.cron.taskSkipped, {
      attributes: {
        ...attributes,
        due: false,
        reason: firstRunWaitsForOffset
          ? "waiting-for-start-offset"
          : attributes.reason,
      },
    });
    return;
  }

  await runCronTask({
    attributes,
    logger,
    run: async () => {
      await runSourceProducerJob({
        context,
        env,
        logger,
        source,
      });
      await context.redis.set(redisKey, shiftedNow.toISOString());
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
  failures: CronTaskFailure[];
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
  failures: CronTaskFailure[];
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

    const failureAttributes = {
      ...attributes,
      durationMs: Date.now() - startedAt,
    };

    failures.push({
      attributes: failureAttributes,
      error: normalizedError,
    });
    logger.error(loggerMessages.scraper.cron.taskFailed, {
      attributes: failureAttributes,
      error: normalizedError,
    });
  }
}

function formatCronTaskFailure({ attributes, error }: CronTaskFailure) {
  return {
    command: getStringAttribute(attributes, "command"),
    durationMs: getNumberAttribute(attributes, "durationMs"),
    error: formatErrorForAttributes(error),
    jobType: getStringAttribute(attributes, "jobType"),
    source: getStringAttribute(attributes, "source"),
    task: getStringAttribute(attributes, "task"),
  };
}

function formatErrorForAttributes(error: unknown): {
  cause?: ReturnType<typeof formatErrorForAttributes>;
  message: string;
  name: string;
} {
  if (!(error instanceof Error)) {
    return {
      message: String(error),
      name: "Error",
    };
  }

  return {
    ...(error.cause === undefined
      ? {}
      : { cause: formatErrorForAttributes(error.cause) }),
    message: error.message,
    name: error.name,
  };
}

function getNumberAttribute(
  attributes: Record<string, unknown>,
  key: string,
): number | undefined {
  return typeof attributes[key] === "number" ? attributes[key] : undefined;
}

function getStringAttribute(
  attributes: Record<string, unknown>,
  key: string,
): string | undefined {
  return typeof attributes[key] === "string" ? attributes[key] : undefined;
}
