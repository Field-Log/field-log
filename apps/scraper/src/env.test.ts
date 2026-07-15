import { describe, expect, it } from "vitest";
import { createScraperEnv, ScraperEnvValidationError } from "./env.schema.js";

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
});
