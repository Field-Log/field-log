import { readProcessScraperRuntimeEnv } from "./env.js";
import { createScraperJobEnv } from "./env.schema.js";
import {
  createScraperJobContext,
  runAutmogProducerJob,
  runQueueProcessorJob,
} from "./jobs.js";
import { createScraperLogger } from "./lib/logger.js";

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
  const context = await createScraperJobContext(env);

  try {
    if (command === "scrape:autmog") {
      await runAutmogProducerJob({ context, logger });
      return;
    }

    await runQueueProcessorJob({ context, env, logger });
  } finally {
    await context.close();
    await logger.flush();
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
