import { loggerValues } from "@package/logger";
import { afterEach, describe, expect, it, vi } from "vitest";
import worker, { runHourlyCron } from "./worker.js";

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
      new Request("https://api.example.test/api/v1/logs", {
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
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Expected a JSON request body.",
    });
  });
});
