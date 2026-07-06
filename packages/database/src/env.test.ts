import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDatabaseEnv } from "./env.schema.js";

describe("database env", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("accepts a valid DATABASE_URL", () => {
    const env = createDatabaseEnv({
      DATABASE_URL: "postgres://user:password@example.com:5432/field_log",
    });

    expect(env.DATABASE_URL).toBe(
      "postgres://user:password@example.com:5432/field_log",
    );
  });

  it("allows DATABASE_URL to be absent", () => {
    const env = createDatabaseEnv({});

    expect(env.DATABASE_URL).toBeUndefined();
  });

  it("rejects malformed DATABASE_URL values", () => {
    expect(() => createDatabaseEnv({ DATABASE_URL: "not a url" })).toThrow(
      "Invalid environment variables",
    );
  });
});
