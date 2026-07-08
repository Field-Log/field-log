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
      VITE_API_BASE_URL: "https://api.preview.example.com",
      VITE_CLERK_PUBLISHABLE_KEY: "pk_test_example",
      VITE_CLERK_SIGN_IN_URL: "/sign-in",
      VITE_CLERK_SIGN_UP_URL: "/sign-up",
      VITE_LOG_PROXY_CLIENT_KEY: "client-key",
      VITE_LOG_PROXY_URL: "https://api.example.com/logs",
    });

    expect(env.VITE_API_BASE_URL).toBe("https://api.preview.example.com");
    expect(env.VITE_CLERK_PUBLISHABLE_KEY).toBe("pk_test_example");
    expect(env.VITE_CLERK_SIGN_IN_URL).toBe("/sign-in");
    expect(env.VITE_CLERK_SIGN_UP_URL).toBe("/sign-up");
    expect(env.VITE_LOG_PROXY_CLIENT_KEY).toBe("client-key");
    expect(env.VITE_LOG_PROXY_URL).toBe("https://api.example.com/logs");
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

  it("rejects malformed client log proxy URLs", () => {
    expect(() =>
      createWebClientEnv({
        VITE_CLERK_PUBLISHABLE_KEY: "pk_test_example",
        VITE_CLERK_SIGN_IN_URL: "/sign-in",
        VITE_CLERK_SIGN_UP_URL: "/sign-up",
        VITE_API_BASE_URL: "not a url",
      }),
    ).toThrow("Invalid environment variables");

    expect(() =>
      createWebClientEnv({
        VITE_CLERK_PUBLISHABLE_KEY: "pk_test_example",
        VITE_CLERK_SIGN_IN_URL: "/sign-in",
        VITE_CLERK_SIGN_UP_URL: "/sign-up",
        VITE_LOG_PROXY_URL: "not a url",
      }),
    ).toThrow("Invalid environment variables");
  });
});

describe("web server env", () => {
  it("validates required server variables", () => {
    const env = createWebServerEnv({
      AXIOM_DATASET: "development",
      AXIOM_EDGE_DOMAIN: "api.axiom.co",
      AXIOM_TOKEN: "xaat-example",
      CLERK_SECRET_KEY: "sk_test_example",
      DATABASE_URL: "postgres://user:password@example.com:5432/field_log",
      LOGGER: "verbose",
      LOG_LEVEL: "debug",
    });

    expect(env.AXIOM_DATASET).toBe("development");
    expect(env.AXIOM_EDGE_DOMAIN).toBe("api.axiom.co");
    expect(env.AXIOM_TOKEN).toBe("xaat-example");
    expect(env.CLERK_SECRET_KEY).toBe("sk_test_example");
    expect(env.DATABASE_URL).toBe(
      "postgres://user:password@example.com:5432/field_log",
    );
    expect(env.LOGGER).toBe("verbose");
    expect(env.LOG_LEVEL).toBe("debug");
  });

  it("rejects missing server values", () => {
    expect(() =>
      createWebServerEnv({
        CLERK_SECRET_KEY: "sk_test_example",
      }),
    ).toThrow("Invalid environment variables");
  });

  it("rejects invalid server logger values", () => {
    expect(() =>
      createWebServerEnv({
        CLERK_SECRET_KEY: "sk_test_example",
        DATABASE_URL: "postgres://user:password@example.com:5432/field_log",
        LOG_LEVEL: "loud",
      }),
    ).toThrow("Invalid environment variables");

    expect(() =>
      createWebServerEnv({
        CLERK_SECRET_KEY: "sk_test_example",
        DATABASE_URL: "postgres://user:password@example.com:5432/field_log",
        LOGGER: "pretty",
      }),
    ).toThrow("Invalid environment variables");
  });
});
