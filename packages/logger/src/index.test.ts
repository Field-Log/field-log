import { describe, expect, it, vi } from "vitest";
import {
  createAxiomTransport,
  createConsoleTransport,
  createLogger,
  createProxyTransport,
  type LogEvent,
  type LogTransport,
  loggerMessages,
  loggerValues,
  normalizeConsoleTransportMode,
  redactValue,
} from "./index.js";

function captureTransport(events: LogEvent[] = []): LogTransport {
  return {
    log(event) {
      events.push(event);
    },
  };
}

describe("logger", () => {
  it("exports reusable logger constants", () => {
    expect(loggerMessages).toMatchObject({
      api: {
        healthChecked: "api.health.checked",
        serverListening: "api.server.listening",
      },
      ci: {
        database: {
          preview: {
            branchCleanupSkipped: "ci.database.preview.branchCleanup.skipped",
            branchCreated: "ci.database.preview.branch.created",
            branchDeleted: "ci.database.preview.branch.deleted",
            branchLimitReached: "ci.database.preview.branchLimit.reached",
            changeDetectionCompleted:
              "ci.database.preview.changeDetection.completed",
            migrationsApplied: "ci.database.preview.migrations.applied",
            noPrBranchNeeded: "ci.database.preview.noPrBranch.needed",
            prBranchRecreateRequested:
              "ci.database.preview.prBranchRecreate.requested",
            stagingDatabaseSelected:
              "ci.database.preview.stagingDatabase.selected",
          },
          production: {
            databaseSelected: "ci.database.production.database.selected",
            migrationsApplied: "ci.database.production.migrations.applied",
          },
          staging: {
            databaseSelected: "ci.database.staging.database.selected",
            migrationsApplied: "ci.database.staging.migrations.applied",
            reset: "ci.database.staging.reset",
          },
        },
        github: {
          dbChangeLabelSynced: "ci.github.dbChangeLabel.synced",
        },
        vercel: {
          preview: {
            databaseOverrideMissing:
              "ci.vercel.preview.databaseOverride.missing",
            databaseOverrideRemoved:
              "ci.vercel.preview.databaseOverride.removed",
            databaseOverrideSet: "ci.vercel.preview.databaseOverride.set",
            latestDeploymentResolved:
              "ci.vercel.preview.latestDeployment.resolved",
            latestDeploymentUnavailable:
              "ci.vercel.preview.latestDeployment.unavailable",
          },
        },
      },
      database: {
        userSettings: {
          getByClerkId: "database.userSettings.getByClerkId",
          upsertForClerkId: "database.userSettings.upsertForClerkId",
        },
        users: {
          ensure: "database.users.ensure",
        },
      },
      mobile: {
        screenViewed: "mobile.screen.viewed",
      },
      web: {
        accountLoaded: "web.account.loaded",
        fxRatesFetchFailed: "web.fxRates.fetch.failed",
        previewApiDerived: "web.previewApi.derived",
      },
    });
    expect(loggerValues).toMatchObject({
      apps: {
        api: "api",
        ci: "ci",
        mobile: "expo",
        web: "web",
      },
      logProxy: {
        clientKeyHeader: "x-log-client-key",
        maxBatchSize: 25,
        source: "log-proxy",
      },
    });
  });

  it("filters events below the configured level", async () => {
    const events: LogEvent[] = [];
    const logger = createLogger({
      app: "test",
      environment: "test",
      level: "warn",
      transports: [captureTransport(events)],
    });

    logger.info("ignored");
    logger.warn("kept");
    await logger.flush();

    expect(events.map((event) => event.message)).toEqual(["kept"]);
  });

  it("merges child context", async () => {
    const events: LogEvent[] = [];
    const logger = createLogger({
      app: "api",
      context: { requestId: "req-1" },
      environment: "test",
      transports: [captureTransport(events)],
    }).child({ userId: "user-1" });

    logger.info("child.context");
    await logger.flush();

    expect(events[0]?.context).toEqual({
      requestId: "req-1",
      userId: "user-1",
    });
  });

  it("redacts sensitive keys", () => {
    expect(
      redactValue({
        nested: {
          api_key: "abc",
          password: "secret",
          visible: "ok",
        },
      }),
    ).toEqual({
      nested: {
        api_key: "[REDACTED]",
        password: "[REDACTED]",
        visible: "ok",
      },
    });
  });

  it("serializes errors", async () => {
    const events: LogEvent[] = [];
    const logger = createLogger({
      app: "api",
      environment: "test",
      transports: [captureTransport(events)],
    });

    logger.error("failed", { error: new TypeError("Nope") });
    await logger.flush();

    expect(events[0]?.error).toMatchObject({
      message: "Nope",
      name: "TypeError",
    });
  });

  it("logs operation timing for success and failure", async () => {
    const events: LogEvent[] = [];
    const logger = createLogger({
      app: "api",
      environment: "test",
      transports: [captureTransport(events)],
    });

    await expect(logger.operation("db.query", () => "ok")).resolves.toBe("ok");
    await expect(
      logger.operation("api.call", () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    await logger.flush();

    expect(events.map((event) => event.message)).toEqual([
      "db.query.succeeded",
      "api.call.failed",
    ]);
    expect(events[0]?.attributes).toMatchObject({
      operation: "db.query",
      outcome: "success",
    });
    expect(events[1]?.attributes).toMatchObject({
      operation: "api.call",
      outcome: "failure",
    });
  });
});

describe("transports", () => {
  it("writes compact console events by default", async () => {
    const writer = {
      error: vi.fn(),
      log: vi.fn(),
      warn: vi.fn(),
    };
    const transport = createConsoleTransport({ writer });

    await transport.log({
      app: "api",
      attributes: {
        durationMs: 12,
        operation: "db.query",
        rawDetail: "omitted",
        source: "log-proxy",
      },
      context: {
        requestId: "req-1",
      },
      environment: "development",
      error: {
        message: "Boom",
        name: "TypeError",
        stack: "stack should be omitted",
      },
      level: "error",
      message: "api.failed",
      rawPayload: {
        token: "redacted",
      },
      timestamp: "2026-01-01T00:00:00.000Z",
    });

    expect(writer.error).toHaveBeenCalledTimes(1);
    const output = JSON.parse(String(writer.error.mock.calls[0]?.[0]));

    expect(output).toEqual({
      app: "api",
      durationMs: 12,
      environment: "development",
      error: {
        message: "Boom",
        name: "TypeError",
      },
      level: "error",
      message: "api.failed",
      operation: "db.query",
      requestId: "req-1",
      source: "log-proxy",
      timestamp: "2026-01-01T00:00:00.000Z",
    });
    expect(JSON.stringify(output)).not.toContain("rawDetail");
    expect(JSON.stringify(output)).not.toContain("rawPayload");
    expect(JSON.stringify(output)).not.toContain("stack should be omitted");
  });

  it("writes verbose console events when configured", async () => {
    const writer = {
      error: vi.fn(),
      log: vi.fn(),
      warn: vi.fn(),
    };
    const transport = createConsoleTransport({
      mode: "verbose",
      writer,
    });

    await transport.log({
      app: "api",
      attributes: {
        route: "/health",
      },
      environment: "development",
      level: "warn",
      message: "api.warned",
      rawPayload: {
        visible: true,
      },
      timestamp: "2026-01-01T00:00:00.000Z",
    });

    expect(writer.warn).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(writer.warn.mock.calls[0]?.[0]))).toEqual({
      app: "api",
      attributes: {
        route: "/health",
      },
      environment: "development",
      level: "warn",
      levelWeight: 50,
      message: "api.warned",
      rawPayload: {
        visible: true,
      },
      timestamp: "2026-01-01T00:00:00.000Z",
    });
  });

  it("allows individual events to override compact console mode", async () => {
    const writer = {
      error: vi.fn(),
      log: vi.fn(),
      warn: vi.fn(),
    };
    const transport = createConsoleTransport({ writer });

    await transport.log({
      app: "web",
      attributes: {
        apiBaseUrl: "https://pr-27-field-log-api-preview.example.test",
        pullRequestId: "27",
      },
      console: {
        mode: "verbose",
      },
      environment: "preview",
      level: "info",
      message: "web.previewApi.derived",
      timestamp: "2026-01-01T00:00:00.000Z",
    });

    expect(writer.log).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(writer.log.mock.calls[0]?.[0]))).toEqual({
      app: "web",
      attributes: {
        apiBaseUrl: "https://pr-27-field-log-api-preview.example.test",
        pullRequestId: "27",
      },
      environment: "preview",
      level: "info",
      levelWeight: 40,
      message: "web.previewApi.derived",
      timestamp: "2026-01-01T00:00:00.000Z",
    });
  });

  it("normalizes console transport mode from LOGGER values", () => {
    expect(normalizeConsoleTransportMode("verbose")).toBe("verbose");
    expect(normalizeConsoleTransportMode("compact")).toBe("compact");
    expect(normalizeConsoleTransportMode(undefined)).toBe("compact");
  });

  it("sends Axiom batches with bearer auth", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });
    const transport = createAxiomTransport({
      dataset: "logs",
      fetch: fetcher,
      token: "token-1",
    });

    await transport.log({
      app: "api",
      console: {
        mode: "verbose",
      },
      environment: "test",
      level: "info",
      message: "hello",
      timestamp: "2026-01-01T00:00:00.000Z",
    });

    expect(fetcher).toHaveBeenCalledWith(
      "https://api.axiom.co/v1/datasets/logs/ingest",
      {
        body: JSON.stringify([
          {
            app: "api",
            environment: "test",
            level: "info",
            message: "hello",
            timestamp: "2026-01-01T00:00:00.000Z",
          },
        ]),
        headers: {
          Authorization: "Bearer token-1",
          "Content-Type": "application/json",
        },
        method: "POST",
      },
    );
  });

  it("sends proxy logs without provider credentials", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
    });
    const transport = createProxyTransport({
      clientKey: "public-key",
      fetch: fetcher,
      url: "https://example.test/logs",
    });

    await transport.log({
      app: "web",
      console: {
        mode: "verbose",
      },
      environment: "test",
      level: "info",
      message: "clicked",
      timestamp: "2026-01-01T00:00:00.000Z",
    });

    expect(fetcher).toHaveBeenCalledWith("https://example.test/logs", {
      body: JSON.stringify({
        events: [
          {
            app: "web",
            environment: "test",
            level: "info",
            message: "clicked",
            timestamp: "2026-01-01T00:00:00.000Z",
          },
        ],
      }),
      headers: {
        "Content-Type": "application/json",
        [loggerValues.logProxy.clientKeyHeader]: "public-key",
      },
      method: "POST",
    });
    expect(JSON.stringify(fetcher.mock.calls)).not.toContain("Bearer");
  });
});
