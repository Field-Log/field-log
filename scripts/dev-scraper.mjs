import {
  ensureScraperRedisContainer,
  getScraperRedisUrl,
  runCommand,
} from "./scraper-redis.mjs";

const redisUrl = getScraperRedisUrl();

await ensureScraperRedisContainer();
await runCommand("pnpm", ["--filter", "@app/scraper", "dev"], {
  ...process.env,
  REDIS_URL: redisUrl,
});
