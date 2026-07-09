import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApiEnv } from "./env.schema.js";

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
    ).toThrow("Invalid environment variables");

    expect(() =>
      createApiEnv({
        DATABASE_URL: "postgres://user:password@example.com:5432/field_log",
        LOGGER: "pretty",
      }),
    ).toThrow("Invalid environment variables");
  });

  it("rejects missing DATABASE_URL", () => {
    expect(() => createApiEnv({ PORT: "3000" })).toThrow(
      "Invalid environment variables",
    );
  });
});
