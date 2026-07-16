import {
  ensureScraperRedisContainer,
  getScraperRedisUrl,
  runCommand,
} from "./scraper-redis.mjs";

const [command, ...commandArgs] = process.argv.slice(2);

if (!command) {
  throw new Error(
    "Expected scraper command. Use scrape, scrape:autmog, or process:queue.",
  );
}

await ensureScraperRedisContainer();

const runnerCommand = getRunnerCommand(command, commandArgs);
await runCommand(runnerCommand.command, runnerCommand.args, {
  ...process.env,
  REDIS_URL: getScraperRedisUrl(),
});

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

  throw new Error(`Unknown scraper command "${command}".`);
}
