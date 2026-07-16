import {
  ensureScraperRedisContainer,
  getScraperRedisUrl,
  printScriptError,
  runCommand,
} from "./scraper-redis.mjs";

try {
  const [command, ...commandArgs] = process.argv.slice(2);

  if (!command) {
    throw new Error(
      "Expected scraper command. Use scrape, scrape:autmog, process:queue, or process:dead-letter.",
    );
  }

  await ensureScraperRedisContainer();

  const runnerCommand = getRunnerCommand(command, commandArgs);
  await runCommand(runnerCommand.command, runnerCommand.args, {
    ...process.env,
    REDIS_URL: getScraperRedisUrl(),
  });
} catch (error) {
  printScriptError(error);
  process.exitCode = 1;
}

function getRunnerCommand(command, commandArgs) {
  if (command === "scrape") {
    return {
      args: [
        "packages/infisical-runner/src/cli.ts",
        "scraper",
        "scrape",
        "--",
        "tsx",
        "apps/scraper/src/cli.ts",
        "scrape",
        ...commandArgs,
      ],
      command: "tsx",
    };
  }

  if (command === "scrape:autmog") {
    return {
      args: [
        "packages/infisical-runner/src/cli.ts",
        "scraper",
        "scrape:autmog",
        "--",
        "tsx",
        "apps/scraper/src/cli.ts",
        "scrape:autmog",
      ],
      command: "tsx",
    };
  }

  if (command === "process:queue") {
    return {
      args: [
        "packages/infisical-runner/src/cli.ts",
        "scraper",
        "process:queue",
        "--",
        "tsx",
        "apps/scraper/src/cli.ts",
        "process:queue",
      ],
      command: "tsx",
    };
  }

  if (command === "process:dead-letter") {
    return {
      args: [
        "packages/infisical-runner/src/cli.ts",
        "scraper",
        "process:dead-letter",
        "--",
        "tsx",
        "apps/scraper/src/cli.ts",
        "process:dead-letter",
      ],
      command: "tsx",
    };
  }

  throw new Error(`Unknown scraper command "${command}".`);
}
