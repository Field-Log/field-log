import { readProcessScraperRuntimeEnv } from "./env.js";
import { createScraperJobEnv } from "./env.schema.js";
import {
  createScraperJobContext,
  runQueueProcessorJob,
  runSourceProducerJob,
  scraperSourceKeys,
} from "./jobs.js";
import { createScraperLogger } from "./lib/logger.js";
import type { ScraperSourceName } from "./scraper-types.js";

type ScraperCommand =
  | {
      type: "process:queue";
    }
  | {
      source: ScraperSourceName;
      type: "scrape";
    };

async function main() {
  const command = parseCommand(process.argv.slice(2));
  const env = createScraperJobEnv(readProcessScraperRuntimeEnv());
  const logger = createScraperLogger({
    appEnv: env.APP_ENV,
    axiomDataset: env.AXIOM_DATASET,
    axiomEdgeDomain: env.AXIOM_EDGE_DOMAIN,
    axiomToken: env.AXIOM_TOKEN,
    loggerMode: env.LOGGER,
    logLevel: env.LOG_LEVEL,
  });
  const context = await createScraperJobContext(env);

  try {
    if (command.type === "scrape") {
      await runSourceProducerJob({
        context,
        logger,
        source: command.source,
      });
      return;
    }

    await runQueueProcessorJob({ context, env, logger });
  } finally {
    await context.close();
    await logger.flush();
  }
}

function parseCommand(args: string[]): ScraperCommand {
  const [command, sourceArg] = args;

  if (command === "process:queue") {
    return { type: "process:queue" };
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
    `Unknown scraper command "${args.join(" ")}". Expected scrape <source>, scrape:<source>, or process:queue. Supported sources: ${scraperSourceKeys.join(", ")}.`,
  );
}

function isScraperSourceKey(
  value: string | undefined,
): value is ScraperSourceName {
  return scraperSourceKeys.some((source) => source === value);
}

void main().catch(() => {
  process.exitCode = 1;
});
