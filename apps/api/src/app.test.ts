import { createLogger, createNoopLogger, type LogEvent } from "@repo/logger";
import { describe, expect, it } from "vitest";
import app, { createApp } from "./app.js";

describe("api", () => {
  it("returns health status", async () => {
    const response = await app.request("/health");

    await expect(response.json()).resolves.toEqual({
      ok: true,
      service: "api",
    });
  });

  it("accepts valid client log events", async () => {
    const events: LogEvent[] = [];
    const logger = createLogger({
      app: "api",
      environment: "test",
      transports: [
        {
          log(event) {
            events.push(event);
          },
        },
      ],
    });
    const testApp = createApp({
      logger,
    });

    const response = await testApp.request("/logs", {
      body: JSON.stringify({
        events: [
          {
            app: "web",
            attributes: {
              route: "/",
              token: "secret",
            },
            environment: "test",
            level: "info",
            message: "client.clicked",
            timestamp: "2026-01-01T00:00:00.000Z",
          },
        ],
      }),
      method: "POST",
    });

    await expect(response.json()).resolves.toEqual({
      accepted: 1,
    });
    expect(events).toHaveLength(1);
    expect(events[0]?.message).toBe("client.clicked");
    expect(events[0]?.attributes).toMatchObject({
      clientApp: "web",
      route: "/",
      source: "log-proxy",
      token: "[REDACTED]",
    });
  });

  it("rejects malformed client log events", async () => {
    const testApp = createApp({
      logger: createNoopLogger(),
    });

    const response = await testApp.request("/logs", {
      body: JSON.stringify({
        level: "info",
      }),
      method: "POST",
    });

    expect(response.status).toBe(400);
  });

  it("rejects oversized client log batches", async () => {
    const testApp = createApp({
      logger: createNoopLogger(),
    });

    const response = await testApp.request("/logs", {
      body: JSON.stringify({
        events: Array.from({ length: 26 }, () => ({
          app: "web",
          environment: "test",
          level: "info",
          message: "client.event",
        })),
      }),
      method: "POST",
    });

    expect(response.status).toBe(400);
  });

  it("rejects invalid client keys when configured", async () => {
    const testApp = createApp({
      clientLogKey: "expected",
      logger: createNoopLogger(),
    });

    const response = await testApp.request("/logs", {
      body: JSON.stringify({
        app: "web",
        environment: "test",
        level: "info",
        message: "client.event",
      }),
      headers: {
        "x-log-client-key": "wrong",
      },
      method: "POST",
    });

    expect(response.status).toBe(401);
  });
});
