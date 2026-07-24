import { describe, expect, it } from "vitest";
import {
  createScraperEnv,
  createScraperJobEnv,
  ScraperEnvValidationError,
} from "./env.schema.js";

describe("scraper env", () => {
  it("validates scraper environment variables", () => {
    const env = createScraperEnv({
      APP_ENV: "preview",
      PORT: "4010",
    });

    expect(env.APP_ENV).toBe("preview");
    expect(env.PORT).toBe(4010);
    expect(env.SCRAPER_SCHEDULER_ENABLED).toBe(false);
  });

  it("defaults PORT to 4007", () => {
    const env = createScraperEnv({});

    expect(env.PORT).toBe(4007);
  });

  it("rejects invalid PORT values", () => {
    expect(() =>
      createScraperEnv({
        PORT: "70000",
      }),
    ).toThrow("Invalid environment variables: PORT");
  });

  it("enables the scheduler when requested", () => {
    const env = createScraperEnv({
      SCRAPER_SCHEDULER_ENABLED: "true",
    });

    expect(env.SCRAPER_SCHEDULER_ENABLED).toBe(true);
  });

  it("exposes sanitized validation issue details", () => {
    expect(() =>
      createScraperEnv({
        PORT: "70000",
      }),
    ).toThrow(ScraperEnvValidationError);

    try {
      createScraperEnv({
        PORT: "70000",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(ScraperEnvValidationError);
      expect(error).toMatchObject({
        issues: [{ variable: "PORT" }],
        message: "Invalid environment variables: PORT",
        name: "ScraperEnvValidationError",
        variables: ["PORT"],
      });
    }
  });

  it("validates scraper job environment variables", () => {
    const env = createScraperJobEnv({
      APP_ENV: "development",
      DATABASE_URL: "postgres://user:password@example.com:5432/field_log",
      IMAGE_KIT_PRIVATE_KEY: "private",
      IMAGE_KIT_PUBLIC_KEY: "public",
      IMAGE_KIT_FOLDER_PREFIX: "preview/pr-52",
      IMAGE_KIT_URL_ENDPOINT: "https://ik.imagekit.io/example",
      REDIS_URL: "redis://localhost:4008",
      GRIMSMO_PROXY_URL: "https://proxy.example.com",
      SCRAPER_AUTMOG_INTERVAL_MINUTES: "45",
      SCRAPER_AUTMOG_START_DELAY_SECONDS: "5",
      SCRAPER_DRY_RUN: "true",
      SCRAPER_GRIMSMO_FJELL_START_DELAY_SECONDS: "1800",
      SCRAPER_GRIMSMO_INTERVAL_MINUTES: "30",
      SCRAPER_GRIMSMO_NORSEMAN_START_DELAY_SECONDS: "2700",
      SCRAPER_GRIMSMO_RASK_START_DELAY_SECONDS: "900",
      SCRAPER_GRIMSMO_SAGA_START_DELAY_SECONDS: "10",
      SCRAPER_IMAGE_BATCH_SIZE: "10",
      SCRAPER_ITEM_BATCH_SIZE: "20",
      SCRAPER_QUEUE_PROCESSOR_INTERVAL_MINUTES: "10",
      SCRAPER_QUEUE_PROCESSOR_START_DELAY_SECONDS: "15",
      SCRAPER_QUEUE_CONCURRENCY: "2",
    });

    expect(env.DATABASE_URL).toBe(
      "postgres://user:password@example.com:5432/field_log",
    );
    expect(env.IMAGE_KIT_FOLDER_PREFIX).toBe("preview/pr-52");
    expect(env.REDIS_URL).toBe("redis://localhost:4008");
    expect(env.GRIMSMO_PROXY_URL).toBe("https://proxy.example.com");
    expect(env.SCRAPER_AUTMOG_INTERVAL_MINUTES).toBe(45);
    expect(env.SCRAPER_AUTMOG_START_DELAY_SECONDS).toBe(5);
    expect(env.SCRAPER_DRY_RUN).toBe(true);
    expect(env.SCRAPER_GRIMSMO_FJELL_START_DELAY_SECONDS).toBe(1800);
    expect(env.SCRAPER_GRIMSMO_INTERVAL_MINUTES).toBe(30);
    expect(env.SCRAPER_GRIMSMO_NORSEMAN_START_DELAY_SECONDS).toBe(2700);
    expect(env.SCRAPER_GRIMSMO_RASK_START_DELAY_SECONDS).toBe(900);
    expect(env.SCRAPER_GRIMSMO_SAGA_START_DELAY_SECONDS).toBe(10);
    expect(env.SCRAPER_IMAGE_BATCH_SIZE).toBe(10);
    expect(env.SCRAPER_ITEM_BATCH_SIZE).toBe(20);
    expect(env.SCRAPER_QUEUE_PROCESSOR_INTERVAL_MINUTES).toBe(10);
    expect(env.SCRAPER_QUEUE_PROCESSOR_START_DELAY_SECONDS).toBe(15);
    expect(env.SCRAPER_QUEUE_CONCURRENCY).toBe(2);
  });

  it("requires Redis and database URLs for scraper jobs", () => {
    expect(() => createScraperJobEnv({})).toThrow(
      "Invalid environment variables: DATABASE_URL, REDIS_URL",
    );
  });

  it("uses REDIS when REDIS_URL is missing", () => {
    const env = createScraperJobEnv({
      DATABASE_URL: "postgres://user:password@example.com:5432/field_log",
      REDIS: "redis://localhost:4008",
    });

    expect(env.REDIS_URL).toBe("redis://localhost:4008");
  });

  it("uses REDIS when REDIS_URL is not a resolved Redis URL", () => {
    const env = createScraperJobEnv({
      DATABASE_URL: "postgres://user:password@example.com:5432/field_log",
      REDIS: "redis://localhost:4008",
      REDIS_URL: "${{scraper-queue.REDIS_PUBLIC_URL}}",
    });

    expect(env.REDIS_URL).toBe("redis://localhost:4008");
  });

  it("rejects Redis references that do not resolve to Redis URLs", () => {
    expect(() =>
      createScraperJobEnv({
        DATABASE_URL: "postgres://user:password@example.com:5432/field_log",
        REDIS: "${{shared.REDIS}}",
        REDIS_URL: "${{scraper-queue.REDIS_PUBLIC_URL}}",
      }),
    ).toThrow("Invalid environment variables: REDIS_URL");
  });

  it("defaults scheduler settings for scraper jobs", () => {
    const env = createScraperJobEnv({
      DATABASE_URL: "postgres://user:password@example.com:5432/field_log",
      REDIS_URL: "redis://localhost:4008",
    });

    expect(env.SCRAPER_AUTMOG_INTERVAL_MINUTES).toBe(60);
    expect(env.SCRAPER_AUTMOG_START_DELAY_SECONDS).toBe(0);
    expect(env.SCRAPER_GRIMSMO_FJELL_START_DELAY_SECONDS).toBe(30 * 60);
    expect(env.SCRAPER_GRIMSMO_INTERVAL_MINUTES).toBe(60);
    expect(env.SCRAPER_GRIMSMO_NORSEMAN_START_DELAY_SECONDS).toBe(45 * 60);
    expect(env.SCRAPER_GRIMSMO_RASK_START_DELAY_SECONDS).toBe(15 * 60);
    expect(env.SCRAPER_GRIMSMO_SAGA_START_DELAY_SECONDS).toBe(0);
    expect(env.SCRAPER_QUEUE_PROCESSOR_INTERVAL_MINUTES).toBe(15);
    expect(env.SCRAPER_QUEUE_PROCESSOR_START_DELAY_SECONDS).toBe(30);
  });
});
