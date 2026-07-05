import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createWebClientEnv } from "./client.schema";
import { createWebServerEnv } from "./server.schema";

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("web client env", () => {
  it("validates required Vite client variables", () => {
    const env = createWebClientEnv({
      VITE_CLERK_PUBLISHABLE_KEY: "pk_test_example",
      VITE_CLERK_SIGN_IN_URL: "/sign-in",
      VITE_CLERK_SIGN_UP_URL: "/sign-up",
    });

    expect(env.VITE_CLERK_PUBLISHABLE_KEY).toBe("pk_test_example");
    expect(env.VITE_CLERK_SIGN_IN_URL).toBe("/sign-in");
    expect(env.VITE_CLERK_SIGN_UP_URL).toBe("/sign-up");
  });

  it("rejects empty client values", () => {
    expect(() =>
      createWebClientEnv({
        VITE_CLERK_PUBLISHABLE_KEY: "",
        VITE_CLERK_SIGN_IN_URL: "/sign-in",
        VITE_CLERK_SIGN_UP_URL: "/sign-up",
      }),
    ).toThrow("Invalid environment variables");
  });
});

describe("web server env", () => {
  it("validates required server variables", () => {
    const env = createWebServerEnv({
      CLERK_SECRET_KEY: "sk_test_example",
      DATABASE_URL: "postgres://user:password@example.com:5432/field_log",
    });

    expect(env.CLERK_SECRET_KEY).toBe("sk_test_example");
    expect(env.DATABASE_URL).toBe(
      "postgres://user:password@example.com:5432/field_log",
    );
  });

  it("rejects missing server values", () => {
    expect(() =>
      createWebServerEnv({
        CLERK_SECRET_KEY: "sk_test_example",
      }),
    ).toThrow("Invalid environment variables");
  });
});
