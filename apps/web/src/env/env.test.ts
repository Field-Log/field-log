import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  applyVercelPreviewApiEnv,
  applyWebClientEnvAliases,
} from "../../vite.config";
import { createWebClientEnv } from "./client.schema";
import { createWebServerEnv } from "./server.schema";

let consoleLogSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
  consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
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

describe("web client env aliases", () => {
  it("maps unprefixed log proxy variables to their Vite client names", () => {
    const runtimeEnv: Record<string, string | undefined> = {
      LOG_PROXY_CLIENT_KEY: "client-key",
      LOG_PROXY_URL: "https://api.example.com/logs",
    };

    applyWebClientEnvAliases(runtimeEnv);

    const env = createWebClientEnv({
      VITE_CLERK_PUBLISHABLE_KEY: "pk_test_example",
      VITE_CLERK_SIGN_IN_URL: "/sign-in",
      VITE_CLERK_SIGN_UP_URL: "/sign-up",
      VITE_LOG_PROXY_CLIENT_KEY: runtimeEnv.VITE_LOG_PROXY_CLIENT_KEY,
      VITE_LOG_PROXY_URL: runtimeEnv.VITE_LOG_PROXY_URL,
    });

    expect(env.VITE_LOG_PROXY_CLIENT_KEY).toBe("client-key");
    expect(env.VITE_LOG_PROXY_URL).toBe("https://api.example.com/logs");
  });

  it("keeps explicit Vite log proxy variables over unprefixed aliases", () => {
    const runtimeEnv: Record<string, string | undefined> = {
      LOG_PROXY_CLIENT_KEY: "fallback-client-key",
      LOG_PROXY_URL: "https://api.example.com/fallback-logs",
      VITE_LOG_PROXY_CLIENT_KEY: "client-key",
      VITE_LOG_PROXY_URL: "https://api.example.com/logs",
    };

    applyWebClientEnvAliases(runtimeEnv);

    expect(runtimeEnv.VITE_LOG_PROXY_CLIENT_KEY).toBe("client-key");
    expect(runtimeEnv.VITE_LOG_PROXY_URL).toBe("https://api.example.com/logs");
  });
});

describe("Vercel preview API env", () => {
  it("derives PR-specific API and log proxy URLs for Vercel previews", () => {
    const runtimeEnv: Record<string, string | undefined> = {
      API_PREVIEW_WORKER_HOST: "field-log-api-preview.23242.workers.dev",
      VERCEL_ENV: "preview",
      VERCEL_GIT_PULL_REQUEST_ID: "27",
    };

    applyVercelPreviewApiEnv(runtimeEnv);

    expect(runtimeEnv.VITE_API_BASE_URL).toBe(
      "https://pr-27-field-log-api-preview.23242.workers.dev",
    );
    expect(runtimeEnv.VITE_LOG_PROXY_URL).toBe(
      "https://pr-27-field-log-api-preview.23242.workers.dev/logs",
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("web.previewApi.derived"),
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('"pullRequestId":"27"'),
    );
  });

  it("normalizes preview Worker hosts that include a protocol or path", () => {
    const runtimeEnv: Record<string, string | undefined> = {
      API_PREVIEW_WORKER_HOST:
        "https://field-log-api-preview.23242.workers.dev/",
      VERCEL_ENV: "preview",
      VERCEL_GIT_PULL_REQUEST_ID: "123",
    };

    applyVercelPreviewApiEnv(runtimeEnv);

    expect(runtimeEnv.VITE_API_BASE_URL).toBe(
      "https://pr-123-field-log-api-preview.23242.workers.dev",
    );
  });

  it("overrides shared preview API values only for Vercel PR previews", () => {
    const runtimeEnv: Record<string, string | undefined> = {
      API_PREVIEW_WORKER_HOST: "field-log-api-preview.23242.workers.dev",
      VERCEL_ENV: "preview",
      VERCEL_GIT_PULL_REQUEST_ID: "42",
      VITE_API_BASE_URL: "https://api.preview.field-log.app",
      VITE_LOG_PROXY_URL: "https://api.preview.field-log.app/logs",
    };

    applyVercelPreviewApiEnv(runtimeEnv);

    expect(runtimeEnv.VITE_API_BASE_URL).toBe(
      "https://pr-42-field-log-api-preview.23242.workers.dev",
    );
    expect(runtimeEnv.VITE_LOG_PROXY_URL).toBe(
      "https://pr-42-field-log-api-preview.23242.workers.dev/logs",
    );
  });

  it("leaves non-preview and non-PR deployments unchanged", () => {
    const productionEnv: Record<string, string | undefined> = {
      API_PREVIEW_WORKER_HOST: "field-log-api-preview.23242.workers.dev",
      VERCEL_ENV: "production",
      VERCEL_GIT_PULL_REQUEST_ID: "27",
      VITE_API_BASE_URL: "https://api.field-log.app",
    };
    const branchPreviewEnv: Record<string, string | undefined> = {
      API_PREVIEW_WORKER_HOST: "field-log-api-preview.23242.workers.dev",
      VERCEL_ENV: "preview",
      VITE_API_BASE_URL: "https://api.preview.field-log.app",
    };

    applyVercelPreviewApiEnv(productionEnv);
    applyVercelPreviewApiEnv(branchPreviewEnv);

    expect(productionEnv.VITE_API_BASE_URL).toBe("https://api.field-log.app");
    expect(branchPreviewEnv.VITE_API_BASE_URL).toBe(
      "https://api.preview.field-log.app",
    );
    expect(branchPreviewEnv.VITE_LOG_PROXY_URL).toBeUndefined();
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
