import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiEnvValidationError, createApiEnv } from "./env.schema.js";

describe("api env", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("validates required API environment variables", () => {
    const env = createApiEnv({
      APP_ENV: "preview",
      AXIOM_DATASET: "development",
      AXIOM_EDGE_DOMAIN: "api.axiom.co",
      AXIOM_TOKEN: "xaat-example",
      DATABASE_URL: "postgres://user:password@example.com:5432/field_log",
      LOGGER: "verbose",
      LOG_LEVEL: "debug",
      LOG_PROXY_CLIENT_KEY: "client-key",
      PORT: "4000",
    });

    expect(env.APP_ENV).toBe("preview");
    expect(env.AXIOM_DATASET).toBe("development");
    expect(env.AXIOM_EDGE_DOMAIN).toBe("api.axiom.co");
    expect(env.AXIOM_TOKEN).toBe("xaat-example");
    expect(env.DATABASE_URL).toBe(
      "postgres://user:password@example.com:5432/field_log",
    );
    expect(env.LOGGER).toBe("verbose");
    expect(env.LOG_LEVEL).toBe("debug");
    expect(env.LOG_PROXY_CLIENT_KEY).toBe("client-key");
    expect(env.PORT).toBe(4000);
  });

  it("defaults PORT to 4006", () => {
    const env = createApiEnv({
      DATABASE_URL: "postgres://user:password@example.com:5432/field_log",
    });

    expect(env.PORT).toBe(4006);
  });

  it("rejects invalid PORT values", () => {
    expect(() =>
      createApiEnv({
        DATABASE_URL: "postgres://user:password@example.com:5432/field_log",
        PORT: "70000",
      }),
    ).toThrow("Invalid environment variables");
  });

  it("rejects invalid logger values", () => {
    expect(() =>
      createApiEnv({
        DATABASE_URL: "postgres://user:password@example.com:5432/field_log",
        LOG_LEVEL: "loud",
      }),
    ).toThrow("Invalid environment variables: LOG_LEVEL");

    expect(() =>
      createApiEnv({
        DATABASE_URL: "postgres://user:password@example.com:5432/field_log",
        LOGGER: "pretty",
      }),
    ).toThrow("Invalid environment variables: LOGGER");
  });

  it("rejects missing DATABASE_URL", () => {
    expect(() => createApiEnv({ PORT: "3000" })).toThrow(
      "Invalid environment variables: DATABASE_URL",
    );
  });

  it("exposes sanitized validation issue details", () => {
    expect(() =>
      createApiEnv({
        DATABASE_URL: "not-a-url",
        LOGGER: "pretty",
        LOG_LEVEL: "loud",
      }),
    ).toThrow(ApiEnvValidationError);

    try {
      createApiEnv({
        DATABASE_URL: "not-a-url",
        LOGGER: "pretty",
        LOG_LEVEL: "loud",
      });
    } catch (error) {
      expect(error).toBeInstanceOf(ApiEnvValidationError);
      expect(error).toMatchObject({
        issues: [
          { variable: "DATABASE_URL" },
          { variable: "LOGGER" },
          { variable: "LOG_LEVEL" },
        ],
        message:
          "Invalid environment variables: DATABASE_URL, LOGGER, LOG_LEVEL",
        name: "ApiEnvValidationError",
        variables: ["DATABASE_URL", "LOGGER", "LOG_LEVEL"],
      });
    }
  });
});
