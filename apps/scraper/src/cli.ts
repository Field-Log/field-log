import { fileURLToPath } from "node:url";
import { type Logger, loggerMessages } from "@package/logger";
import { runRailwayCronJob } from "./cron.js";
import { readProcessScraperRuntimeEnv } from "./env.js";
import { createScraperJobEnv } from "./env.schema.js";
import {
  createScraperJobContext,
  runQueueDeadLetterProcessorJob,
  runQueueProcessorJob,
  runSourceProducerJob,
  scraperSourceKeys,
} from "./jobs.js";
import { createScraperLogger } from "./lib/logger.js";
import type { ScraperSourceName } from "./scraper-types.js";

type ScraperCommand =
  | {
      type: "cron:run";
    }
  | {
      type: "process:dead-letter";
    }
  | {
      type: "process:queue";
    }
  | {
      source: ScraperSourceName;
      type: "scrape";
    };

async function main() {
  let logger: Logger | undefined;
  let command: ScraperCommand | undefined;
  let context: Awaited<ReturnType<typeof createScraperJobContext>> | undefined;

  try {
    command = parseCommand(process.argv.slice(2));
    const env = createScraperJobEnv(readProcessScraperRuntimeEnv());
    logger = createScraperLogger({
      appEnv: env.APP_ENV,
      axiomDataset: env.AXIOM_DATASET,
      axiomEdgeDomain: env.AXIOM_EDGE_DOMAIN,
      axiomToken: env.AXIOM_TOKEN,
      loggerMode: env.LOGGER,
      logLevel: env.LOG_LEVEL,
    });
    context = await createScraperJobContext(env, logger);

    if (command.type === "cron:run") {
      await runRailwayCronJob({ context, env, logger });
      return;
    }

    if (command.type === "scrape") {
      await runSourceProducerJob({
        context,
        env,
        logger,
        source: command.source,
      });
      return;
    }

    if (command.type === "process:dead-letter") {
      await runQueueDeadLetterProcessorJob({ context, env, logger });
      return;
    }

    await runQueueProcessorJob({ context, env, logger });
  } catch (error) {
    logger ??= createScraperLogger({});
    logger.fatal(loggerMessages.scraper.run.failed, {
      attributes: {
        command: command ? formatCommand(command) : undefined,
        commandArgs: process.argv.slice(2).join(" "),
      },
      error,
    });
    throw error;
  } finally {
    await context?.close();
    await logger?.flush();
  }
}

export function parseCommand(args: string[]): ScraperCommand {
  const normalizedArgs = args.filter((arg) => arg !== "--");
  const [command, sourceArg] = normalizedArgs;

  if (command === "cron:run") {
    return { type: "cron:run" };
  }

  if (command === "process:queue") {
    return { type: "process:queue" };
  }

  if (command === "process:dead-letter") {
    return { type: "process:dead-letter" };
  }

  if (command === "scrape" && isScraperSourceKey(sourceArg)) {
    return {
      source: sourceArg,
      type: "scrape",
    };
  }

  const [prefix, sourceKey] = command?.split(":") ?? [];

  if (prefix === "scrape" && isScraperSourceKey(sourceKey)) {
    return {
      source: sourceKey,
      type: "scrape",
    };
  }

  throw new Error(
    `Unknown scraper command "${args.join(" ")}". Expected cron:run, scrape <source>, scrape:<source>, process:queue, or process:dead-letter. Supported sources: ${scraperSourceKeys.join(", ")}.`,
  );
}

function formatCommand(command: ScraperCommand): string {
  if (
    command.type === "cron:run" ||
    command.type === "process:queue" ||
    command.type === "process:dead-letter"
  ) {
    return command.type;
  }

  return `${command.type}:${command.source}`;
}

function isScraperSourceKey(
  value: string | undefined,
): value is ScraperSourceName {
  return scraperSourceKeys.some((source) => source === value);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  void main().catch(() => {
    process.exitCode = 1;
  });
}
