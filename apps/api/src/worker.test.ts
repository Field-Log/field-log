import { loggerValues } from "@package/logger";
import { afterEach, describe, expect, it, vi } from "vitest";
import worker, { runHourlyCron, runScheduled } from "./worker.js";

describe("api worker", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("emits the hourly cron event to Axiom", async () => {
    const requests: Array<{ body: unknown; input: string }> = [];

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string, init?: { body?: string }) => {
        requests.push({
          body: init?.body ? JSON.parse(init.body) : undefined,
          input,
        });

        return {
          ok: true,
          status: 200,
        };
      }),
    );

    await runHourlyCron(
      {
        cron: "0 * * * *",
        scheduledTime: Date.parse("2026-07-07T12:00:00.000Z"),
      },
      {
        APP_ENV: "preview",
        AXIOM_DATASET: "testing",
        AXIOM_TOKEN: "xaat-example",
        DATABASE_URL: "postgres://user:password@example.com:5432/field_log",
      },
    );

    expect(requests).toHaveLength(1);
    expect(requests[0]?.input).toBe(
      "https://api.axiom.co/v1/datasets/testing/ingest",
    );
    expect(requests[0]?.body).toEqual([
      expect.objectContaining({
        app: "api",
        attributes: {
          cron: "0 * * * *",
          scheduledAt: "2026-07-07T12:00:00.000Z",
          source: "cloudflare-cron",
        },
        environment: "preview",
        level: "info",
        message: "api.cron.hourly",
      }),
    ]);
  });

  it("handles client log requests without database bindings", async () => {
    const response = await worker.fetch(
      new Request("https://api.example.test/api/v0/logs", {
        body: "not-json",
        headers: {
          [loggerValues.logProxy.clientKeyHeader]: "runtime-key",
        },
        method: "POST",
      }),
      {
        APP_ENV: "preview",
        LOG_PROXY_CLIENT_KEY: "runtime-key",
      },
      {
        waitUntil: vi.fn(),
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Expected a JSON request body.",
    });
  });

  it("captures request-time logger env failures when only Axiom env is usable", async () => {
    const requests: Array<{ body: unknown; input: string }> = [];

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string, init?: { body?: string }) => {
        requests.push({
          body: init?.body ? JSON.parse(init.body) : undefined,
          input,
        });

        return {
          ok: true,
          status: 200,
        };
      }),
    );

    const response = await worker.fetch(
      new Request("https://api.field-log.app/api/v0/logs", {
        body: JSON.stringify({
          app: "web",
          environment: "production",
          level: "info",
          message: "client.event",
        }),
        method: "POST",
      }),
      {
        AXIOM_DATASET: "testing",
        AXIOM_TOKEN: "xaat-example",
        DATABASE_URL: "not-a-url",
        LOGGER: "not-a-logger",
        LOG_LEVEL: "not-a-level",
        LOG_PROXY_CLIENT_KEY: "",
      },
      {
        waitUntil: vi.fn(),
      },
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "Internal server error.",
    });
    expect(requests).toHaveLength(1);
    expect(requests[0]?.input).toBe(
      "https://api.axiom.co/v1/datasets/testing/ingest",
    );
    expect(requests[0]?.body).toEqual([
      expect.objectContaining({
        app: "api",
        attributes: {
          envValidationIssues: [
            {
              message: expect.any(String),
              variable: "LOGGER",
            },
            {
              message: expect.any(String),
              variable: "LOG_LEVEL",
            },
          ],
          envValidationVariables: ["LOGGER", "LOG_LEVEL"],
          method: "POST",
          path: "/api/v0/logs",
          source: "cloudflare-worker",
          trigger: "fetch",
        },
        environment: "unknown",
        error: {
          message: "Invalid environment variables: LOGGER, LOG_LEVEL",
          name: "ApiEnvValidationError",
          stack: expect.any(String),
        },
        level: "error",
      }),
    ]);
  });

  it("captures scheduled logger env failures when only Axiom env is usable", async () => {
    const requests: Array<{ body: unknown; input: string }> = [];

    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: string, init?: { body?: string }) => {
        requests.push({
          body: init?.body ? JSON.parse(init.body) : undefined,
          input,
        });

        return {
          ok: true,
          status: 200,
        };
      }),
    );

    await runScheduled(
      {
        cron: "0 * * * *",
        scheduledTime: Date.parse("2026-07-07T12:00:00.000Z"),
      },
      {
        AXIOM_DATASET: "testing",
        AXIOM_TOKEN: "xaat-example",
        DATABASE_URL: "not-a-url",
        LOGGER: "not-a-logger",
        LOG_LEVEL: "not-a-level",
        LOG_PROXY_CLIENT_KEY: "",
      },
    );

    expect(requests).toHaveLength(1);
    expect(requests[0]?.body).toEqual([
      expect.objectContaining({
        app: "api",
        attributes: {
          cron: "0 * * * *",
          envValidationIssues: [
            {
              message: expect.any(String),
              variable: "LOGGER",
            },
            {
              message: expect.any(String),
              variable: "LOG_LEVEL",
            },
          ],
          envValidationVariables: ["LOGGER", "LOG_LEVEL"],
          scheduledAt: "2026-07-07T12:00:00.000Z",
          source: "cloudflare-cron",
          trigger: "scheduled",
        },
        environment: "unknown",
        error: {
          message: "Invalid environment variables: LOGGER, LOG_LEVEL",
          name: "ApiEnvValidationError",
          stack: expect.any(String),
        },
        level: "error",
      }),
    ]);
  });
});
