import {
  ensureScraperRedisContainer,
  getScraperRedisUrl,
  printScriptError,
  runCommand,
} from "./scraper-redis.mjs";

try {
  const redisUrl = getScraperRedisUrl();

  await ensureScraperRedisContainer();
  await runCommand("pnpm", ["--filter", "@app/scraper", "dev"], {
    ...process.env,
    REDIS_URL: redisUrl,
  });
} catch (error) {
  printScriptError(error);
  process.exitCode = 1;
}
