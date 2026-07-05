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
      DATABASE_URL: "postgres://user:password@example.com:5432/field_log",
      PORT: "4000",
    });

    expect(env.DATABASE_URL).toBe(
      "postgres://user:password@example.com:5432/field_log",
    );
    expect(env.PORT).toBe(4000);
  });

  it("defaults PORT to 3000", () => {
    const env = createApiEnv({
      DATABASE_URL: "postgres://user:password@example.com:5432/field_log",
    });

    expect(env.PORT).toBe(3000);
  });

  it("rejects invalid PORT values", () => {
    expect(() =>
      createApiEnv({
        DATABASE_URL: "postgres://user:password@example.com:5432/field_log",
        PORT: "70000",
      }),
    ).toThrow("Invalid environment variables");
  });

  it("rejects missing DATABASE_URL", () => {
    expect(() => createApiEnv({ PORT: "3000" })).toThrow(
      "Invalid environment variables",
    );
  });
});
