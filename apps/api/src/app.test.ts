import {
  createLogger,
  createNoopLogger,
  type LogEvent,
  loggerValues,
} from "@package/logger";
import { describe, expect, it } from "vitest";
import app, { createApp } from "./app.js";
import { apiDocsPath, openApiJsonPath } from "./openapi.js";

type OpenApiDocument = {
  info: {
    title: string;
    version: string;
  };
  openapi: string;
  paths: Record<string, unknown>;
};

describe("api", () => {
  it("returns health status", async () => {
    const response = await app.request("/api/v1/health");

    await expect(response.json()).resolves.toEqual({
      ok: true,
      service: "api",
    });
  });

  it("serves the OpenAPI 3.1 document", async () => {
    const response = await app.request(openApiJsonPath);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");

    const document = (await response.json()) as OpenApiDocument;

    expect(document.openapi).toBe("3.1.0");
    expect(document.info).toMatchObject({
      title: "Field Log API",
      version: "0.0.0",
    });
    expect(document.paths["/api/v1/health"]).toBeDefined();
    expect(document.paths["/api/v1/logs"]).toBeDefined();
  });

  it("serves the Scalar API reference", async () => {
    const response = await app.request(apiDocsPath);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    await expect(response.text()).resolves.toContain("Field Log API Reference");
  });

  it("does not expose unversioned routes", async () => {
    await expect(app.request("/")).resolves.toMatchObject({
      status: 404,
    });
    await expect(app.request("/health")).resolves.toMatchObject({
      status: 404,
    });
    await expect(
      app.request("/logs", {
        method: "POST",
      }),
    ).resolves.toMatchObject({
      status: 404,
    });
    await expect(app.request("/openapi.json")).resolves.toMatchObject({
      status: 404,
    });
    await expect(app.request("/docs")).resolves.toMatchObject({
      status: 404,
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

    const response = await testApp.request("/api/v1/logs", {
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
      source: loggerValues.logProxy.source,
      token: "[REDACTED]",
    });
  });

  it("rejects malformed client log events", async () => {
    const testApp = createApp({
      logger: createNoopLogger(),
    });

    const response = await testApp.request("/api/v1/logs", {
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

    const response = await testApp.request("/api/v1/logs", {
      body: JSON.stringify({
        events: Array.from(
          { length: loggerValues.logProxy.maxBatchSize + 1 },
          () => ({
            app: "web",
            environment: "test",
            level: "info",
            message: "client.event",
          }),
        ),
      }),
      method: "POST",
    });

    expect(response.status).toBe(400);
  });

  it("accepts configured client keys from the centralized header", async () => {
    const testApp = createApp({
      clientLogKey: "expected",
      logger: createNoopLogger(),
    });

    const response = await testApp.request("/api/v1/logs", {
      body: JSON.stringify({
        events: [
          {
            app: "web",
            environment: "test",
            level: "info",
            message: "client.event",
          },
        ],
      }),
      headers: {
        [loggerValues.logProxy.clientKeyHeader]: "expected",
      },
      method: "POST",
    });

    expect(response.status).toBe(200);
  });

  it("accepts request-time client keys from runtime config", async () => {
    const testApp = createApp({
      getRuntimeConfig() {
        return {
          clientLogKey: "runtime-key",
          logger: createNoopLogger(),
        };
      },
    });

    const response = await testApp.request("/api/v1/logs", {
      body: JSON.stringify({
        app: "web",
        environment: "test",
        level: "info",
        message: "client.event",
      }),
      headers: {
        [loggerValues.logProxy.clientKeyHeader]: "runtime-key",
      },
      method: "POST",
    });

    expect(response.status).toBe(200);
  });

  it("rejects invalid client keys when configured", async () => {
    const testApp = createApp({
      clientLogKey: "expected",
      logger: createNoopLogger(),
    });

    const response = await testApp.request("/api/v1/logs", {
      body: JSON.stringify({
        app: "web",
        environment: "test",
        level: "info",
        message: "client.event",
      }),
      headers: {
        [loggerValues.logProxy.clientKeyHeader]: "wrong",
      },
      method: "POST",
    });

    expect(response.status).toBe(401);
  });
});
