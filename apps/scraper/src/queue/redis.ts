import { Redis } from "ioredis";

export function createRedisConnection(redisUrl: string): Redis {
  const redis = new Redis(redisUrl, {
    connectTimeout: 5_000,
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
    retryStrategy(times) {
      return times <= 3 ? Math.min(times * 250, 1_000) : null;
    },
  });

  redis.on("error", () => {
    // Connection failures are surfaced by the command that is waiting on Redis.
  });

  return redis;
}
