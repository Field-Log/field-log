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
      IMAGE_KIT_URL_ENDPOINT: "https://ik.imagekit.io/example",
      REDIS_URL: "redis://localhost:6379",
      SCRAPER_DRY_RUN: "true",
      SCRAPER_IMAGE_BATCH_SIZE: "10",
      SCRAPER_ITEM_BATCH_SIZE: "20",
      SCRAPER_QUEUE_CONCURRENCY: "2",
    });

    expect(env.DATABASE_URL).toBe(
      "postgres://user:password@example.com:5432/field_log",
    );
    expect(env.REDIS_URL).toBe("redis://localhost:6379");
    expect(env.SCRAPER_DRY_RUN).toBe(true);
    expect(env.SCRAPER_IMAGE_BATCH_SIZE).toBe(10);
    expect(env.SCRAPER_ITEM_BATCH_SIZE).toBe(20);
    expect(env.SCRAPER_QUEUE_CONCURRENCY).toBe(2);
  });

  it("requires Redis and database URLs for scraper jobs", () => {
    expect(() => createScraperJobEnv({})).toThrow(
      "Invalid environment variables: DATABASE_URL, REDIS_URL",
    );
  });
});
