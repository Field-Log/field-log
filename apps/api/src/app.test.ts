import {
  createLogger,
  createNoopLogger,
  type LogEvent,
  loggerValues,
} from "@package/logger";
import type { FeatureFlagsService } from "@package/services";
import { describe, expect, it, vi } from "vitest";
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
    const response = await app.request("/api/v0/health");

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
    expect(document.paths["/api/v0/health"]).toBeDefined();
    expect(document.paths["/api/v0/feature-flags/beta"]).toBeDefined();
    expect(document.paths["/api/v0/logs"]).toBeDefined();
  });

  it("serves the Scalar API reference", async () => {
    const response = await app.request(apiDocsPath);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    await expect(response.text()).resolves.toContain("Field Log API Reference");
  });

  it("does not expose previous major version routes", async () => {
    await expect(app.request("/api/v1/health")).resolves.toMatchObject({
      status: 404,
    });
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

    const response = await testApp.request("/api/v0/logs", {
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

    const response = await testApp.request("/api/v0/logs", {
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

    const response = await testApp.request("/api/v0/logs", {
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

    const response = await testApp.request("/api/v0/logs", {
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

    const response = await testApp.request("/api/v0/logs", {
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

    const response = await testApp.request("/api/v0/logs", {
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

  it("returns the default mobile version policy", async () => {
    const response = await app.request("/api/v0/mobile-version");

    await expect(response.json()).resolves.toEqual({
      androidStoreUrl: null,
      iosStoreUrl: null,
      latestVersion: null,
      minimumSupportedVersion: null,
      severity: "none",
    });
  });

  it("returns configured mobile version policy values", async () => {
    const testApp = createApp({
      mobileVersionPolicy: {
        androidStoreUrl:
          "https://play.google.com/store/apps/details?id=com.example.app",
        iosStoreUrl: "https://apps.apple.com/app/example/id123456789",
        latestVersion: "0.2.0",
        minimumSupportedVersion: "0.1.0",
        severity: "recommended",
      },
    });

    const response = await testApp.request("/api/v0/mobile-version");

    await expect(response.json()).resolves.toEqual({
      androidStoreUrl:
        "https://play.google.com/store/apps/details?id=com.example.app",
      iosStoreUrl: "https://apps.apple.com/app/example/id123456789",
      latestVersion: "0.2.0",
      minimumSupportedVersion: "0.1.0",
      severity: "recommended",
    });
  });

  it("lists beta feature flags for authenticated users", async () => {
    const featureFlags = createFeatureFlagsServiceMock({
      listUserBeta: async () => [
        {
          description: "Try the new library filters.",
          enabled: true,
          name: "New library filters",
          slug: "new-library-filters",
        },
      ],
    });
    const testApp = createApp({
      getFeatureFlagAuth: () => ({ clerkId: "user_123" }),
      getFeatureFlagsService: () => featureFlags,
      logger: createNoopLogger(),
    });

    const response = await testApp.request("/api/v0/feature-flags/beta");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      flags: [
        {
          description: "Try the new library filters.",
          enabled: true,
          name: "New library filters",
          slug: "new-library-filters",
        },
      ],
    });
  });

  it("requires auth for beta feature flag routes", async () => {
    const testApp = createApp({
      getFeatureFlagAuth: () => null,
      getFeatureFlagsService: () => createFeatureFlagsServiceMock(),
      logger: createNoopLogger(),
    });

    await expect(
      testApp.request("/api/v0/feature-flags/beta"),
    ).resolves.toMatchObject({ status: 401 });
  });

  it("updates beta feature flag preferences", async () => {
    const setUserPreference = vi.fn(async () => undefined);
    const testApp = createApp({
      getFeatureFlagAuth: () => ({ clerkId: "user_123" }),
      getFeatureFlagsService: () =>
        createFeatureFlagsServiceMock({ setUserPreference }),
      logger: createNoopLogger(),
    });

    const response = await testApp.request(
      "/api/v0/feature-flags/beta/new-library-filters",
      {
        body: JSON.stringify({ enabled: true }),
        method: "PUT",
      },
    );

    expect(response.status).toBe(200);
    expect(setUserPreference).toHaveBeenCalledWith({
      actorClerkId: "user_123",
      enabled: true,
      slug: "new-library-filters",
    });
  });

  it("evaluates requested feature flags for authenticated users", async () => {
    const evaluateMany = vi.fn(async () => ({
      "new-library-filters": true,
    }));
    const testApp = createApp({
      getFeatureFlagAuth: () => ({ clerkId: "user_123" }),
      getFeatureFlagsService: () =>
        createFeatureFlagsServiceMock({ evaluateMany }),
      logger: createNoopLogger(),
    });

    const response = await testApp.request("/api/v0/feature-flags/evaluate", {
      body: JSON.stringify({ slugs: ["new-library-filters"] }),
      method: "POST",
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      flags: {
        "new-library-filters": true,
      },
    });
    expect(evaluateMany).toHaveBeenCalledWith({
      clerkId: "user_123",
      slugs: ["new-library-filters"],
    });
  });
});

function createFeatureFlagsServiceMock(
  overrides: Partial<FeatureFlagsService> = {},
): FeatureFlagsService {
  return {
    archive: async () => undefined,
    create: async () => {
      throw new Error("Not implemented.");
    },
    evaluate: async () => false,
    evaluateMany: async () => ({}),
    listAdmin: async () => [],
    listAdminTargetingForUser: async () => [],
    listUserBeta: async () => [],
    setAdminOverride: async () => undefined,
    setUserPreference: async () => undefined,
    update: async () => {
      throw new Error("Not implemented.");
    },
    ...overrides,
  };
}
