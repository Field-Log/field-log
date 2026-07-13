import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { createApp } from "../../../apps/api/src/app.js";
import {
  createAxiomTransport,
  createLogger,
  createProxyTransport,
  type FetchLike,
  isLogLevel,
  type LogLevel,
  logLevels,
} from "../src/index.js";

type QueryRow = Record<string, unknown>;

type AxiomField = {
  name: string;
};

type AxiomTable = {
  columns?: unknown[][];
  fields?: AxiomField[];
};

type AxiomTabularResponse = {
  tables?: AxiomTable[];
};

const requiredDataset = "testing";
const requiredLogLevel = "trace";
const defaultTimeoutMs = 90_000;
const defaultPollIntervalMs = 5_000;

async function main(): Promise<void> {
  const config = readConfig();
  const startedAt = new Date(Date.now() - 60_000).toISOString();
  const runId = randomUUID();
  const runPrefix = `logger-live-${runId}`;
  const secrets = createSecretValues(runPrefix);
  const expectedMessages: string[] = [];

  const axiomTransport = createAxiomTransport({
    dataset: config.dataset,
    edgeDomain: config.edgeDomain,
    token: config.token,
  });

  const directLogger = createLogger({
    app: "logger-live-direct",
    context: {
      path: "direct",
      suite: "logger-axiom-live",
      testRunId: runId,
    },
    environment: "automated-tests",
    level: config.logLevel,
    transports: [axiomTransport],
  });

  for (const level of logLevels) {
    const eventMessage = message(runPrefix, `direct.level.${level}`);
    expectedMessages.push(eventMessage);
    directLogger[level](eventMessage, {
      attributes: {
        emittedLevel: level,
        token: secrets.directAttributeToken,
      },
    });
  }

  const rawPayloadMessage = message(runPrefix, "direct.raw-payload");
  expectedMessages.push(rawPayloadMessage);
  directLogger.info(rawPayloadMessage, {
    attributes: {
      case: "raw-payload",
      password: secrets.directAttributePassword,
    },
    includeRawPayload: true,
    rawPayload: {
      nested: {
        secret: secrets.directRawSecret,
      },
      token: secrets.directRawToken,
      visible: "raw payload visible value",
    },
  });

  const childMessage = message(runPrefix, "direct.child-context");
  expectedMessages.push(childMessage);
  directLogger
    .child({
      childContext: "child-value",
      token: secrets.directChildToken,
    })
    .info(childMessage);

  const errorMessage = message(runPrefix, "direct.error");
  expectedMessages.push(errorMessage);
  directLogger.error(errorMessage, {
    error: new Error("Direct live error"),
  });

  const operationSuccess = message(runPrefix, "direct.operation.success");
  expectedMessages.push(`${operationSuccess}.succeeded`);
  await directLogger.operation(operationSuccess, async () => {
    await delay(5);
    return "ok";
  });

  const operationFailure = message(runPrefix, "direct.operation.failure");
  expectedMessages.push(`${operationFailure}.failed`);
  await assert.rejects(
    directLogger.operation(operationFailure, () => {
      throw new Error("Direct operation failure");
    }),
    /Direct operation failure/,
  );

  const filteredLogger = createLogger({
    app: "logger-live-direct",
    context: {
      path: "direct-filter",
      suite: "logger-axiom-live",
      testRunId: runId,
    },
    environment: "automated-tests",
    level: "warn",
    transports: [axiomTransport],
  });
  const filteredInfoMessage = message(runPrefix, "direct.filter.info");
  const filteredWarnMessage = message(runPrefix, "direct.filter.warn");
  expectedMessages.push(filteredWarnMessage);
  filteredLogger.info(filteredInfoMessage);
  filteredLogger.warn(filteredWarnMessage);

  const apiLogger = createLogger({
    app: "api",
    context: {
      path: "proxy-server",
      suite: "logger-axiom-live",
      testRunId: runId,
    },
    environment: "automated-tests",
    level: config.logLevel,
    transports: [axiomTransport],
  });
  const apiApp = createApp({
    clientLogKey: config.logProxyClientKey,
    logger: apiLogger,
  });
  const proxyFetch: FetchLike = async (_input, init) => {
    const response = await apiApp.request("/api/v1/logs", {
      body: init?.body,
      headers: init?.headers,
      method: init?.method ?? "POST",
    });

    return {
      ok: response.ok,
      status: response.status,
      text: () => response.text(),
    };
  };
  const proxyLogger = createLogger({
    app: "web",
    context: {
      path: "proxy-client",
      proxyContext: "client-value",
      suite: "logger-axiom-live",
      testRunId: runId,
      token: secrets.proxyContextToken,
    },
    environment: "automated-tests",
    level: config.logLevel,
    transports: [
      createProxyTransport({
        clientKey: config.logProxyClientKey,
        fetch: proxyFetch,
        url: "http://logger-live.test/api/v1/logs",
      }),
    ],
  });

  for (const level of logLevels) {
    const eventMessage = message(runPrefix, `proxy.level.${level}`);
    expectedMessages.push(eventMessage);
    proxyLogger[level](eventMessage, {
      attributes: {
        emittedLevel: level,
        token: secrets.proxyAttributeToken,
      },
    });
  }

  const proxyErrorMessage = message(runPrefix, "proxy.error");
  expectedMessages.push(proxyErrorMessage);
  proxyLogger.error(proxyErrorMessage, {
    error: new TypeError("Proxy client live error"),
  });

  const proxyRawPayloadMessage = message(runPrefix, "proxy.raw-payload");
  expectedMessages.push(proxyRawPayloadMessage);
  proxyLogger.info(proxyRawPayloadMessage, {
    includeRawPayload: true,
    rawPayload: {
      authorization: secrets.proxyRawAuthorization,
      visible: "proxy raw payload visible value",
    },
  });

  await directLogger.flush();
  await filteredLogger.flush();
  await proxyLogger.flush();
  await apiLogger.flush();

  console.log(`logger live test run: ${runId}`);
  console.log(`waiting for ${expectedMessages.length} events in Axiom`);

  const rows = await waitForRows({
    config,
    expectedMessages,
    runPrefix,
    startedAt,
  });

  assertRows(rows, {
    expectedMessages,
    filteredInfoMessage,
    runPrefix,
    secrets,
  });

  console.log(`received ${rows.length} matching Axiom events`);
}

function readConfig(): {
  dataset: string;
  edgeDomain?: string;
  logLevel: LogLevel;
  logProxyClientKey: string;
  pollIntervalMs: number;
  timeoutMs: number;
  token: string;
} {
  const token = requiredEnv("AXIOM_TOKEN");
  const dataset = requiredEnv("AXIOM_DATASET");
  const logLevelValue = requiredEnv("LOG_LEVEL");
  const logProxyClientKey = requiredEnv("LOG_PROXY_CLIENT_KEY");
  const logLevel = parseLogLevel(logLevelValue);

  assert.equal(
    dataset,
    requiredDataset,
    `AXIOM_DATASET must be "${requiredDataset}" for the live logger test.`,
  );
  assert.equal(
    logLevel,
    requiredLogLevel,
    `LOG_LEVEL must be "${requiredLogLevel}" for the live logger test to cover every level.`,
  );

  return {
    dataset,
    edgeDomain: optionalEnv("AXIOM_EDGE_DOMAIN"),
    logLevel,
    logProxyClientKey,
    pollIntervalMs: parseOptionalPositiveInteger(
      "AXIOM_TEST_POLL_INTERVAL_MS",
      defaultPollIntervalMs,
    ),
    timeoutMs: parseOptionalPositiveInteger(
      "AXIOM_TEST_TIMEOUT_MS",
      defaultTimeoutMs,
    ),
    token,
  };
}

function parseLogLevel(value: string): LogLevel {
  assert.ok(isLogLevel(value), `LOG_LEVEL must be a valid log level: ${value}`);

  return value;
}

function requiredEnv(name: string): string {
  const value = process.env[name];
  assert.ok(value, `${name} is required.`);

  return value;
}

function optionalEnv(name: string): string | undefined {
  const value = process.env[name];

  return value ? value : undefined;
}

function parseOptionalPositiveInteger(name: string, fallback: number): number {
  const value = process.env[name];

  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  assert.ok(
    Number.isInteger(parsed) && parsed > 0,
    `${name} must be a positive integer.`,
  );

  return parsed;
}

function createSecretValues(runPrefix: string): Record<string, string> {
  return {
    directAttributePassword: `${runPrefix}-direct-attribute-password`,
    directAttributeToken: `${runPrefix}-direct-attribute-token`,
    directChildToken: `${runPrefix}-direct-child-token`,
    directRawSecret: `${runPrefix}-direct-raw-secret`,
    directRawToken: `${runPrefix}-direct-raw-token`,
    proxyAttributeToken: `${runPrefix}-proxy-attribute-token`,
    proxyContextToken: `${runPrefix}-proxy-context-token`,
    proxyRawAuthorization: `${runPrefix}-proxy-raw-authorization`,
  };
}

function message(runPrefix: string, name: string): string {
  return `${runPrefix}.${name}`;
}

async function waitForRows(input: {
  config: {
    dataset: string;
    edgeDomain?: string;
    pollIntervalMs: number;
    timeoutMs: number;
    token: string;
  };
  expectedMessages: readonly string[];
  runPrefix: string;
  startedAt: string;
}): Promise<QueryRow[]> {
  const deadline = Date.now() + input.config.timeoutMs;
  let lastRows: QueryRow[] = [];

  while (Date.now() < deadline) {
    lastRows = await queryAxiom({
      config: input.config,
      runPrefix: input.runPrefix,
      startedAt: input.startedAt,
    });

    const messages = new Set(
      lastRows.map((row) => getField(row, "message")).filter(isString),
    );
    const missingMessages = input.expectedMessages.filter(
      (expectedMessage) => !messages.has(expectedMessage),
    );

    if (missingMessages.length === 0) {
      return lastRows;
    }

    console.log(
      `received ${messages.size}/${input.expectedMessages.length}; waiting for: ${missingMessages
        .slice(0, 5)
        .join(", ")}`,
    );
    await delay(input.config.pollIntervalMs);
  }

  const finalMessages = new Set(
    lastRows.map((row) => getField(row, "message")).filter(isString),
  );
  const missingMessages = input.expectedMessages.filter(
    (expectedMessage) => !finalMessages.has(expectedMessage),
  );

  throw new Error(
    [
      `Timed out after ${input.config.timeoutMs}ms waiting for Axiom events.`,
      `Missing ${missingMessages.length} events:`,
      ...missingMessages.map((missingMessage) => `- ${missingMessage}`),
    ].join("\n"),
  );
}

async function queryAxiom(input: {
  config: {
    dataset: string;
    edgeDomain?: string;
    token: string;
  };
  runPrefix: string;
  startedAt: string;
}): Promise<QueryRow[]> {
  const domain = input.config.edgeDomain ?? "api.axiom.co";
  const apl = [
    `['${input.config.dataset}']`,
    `| where message contains ${quoteAplString(input.runPrefix)}`,
    "| limit 100",
  ].join("\n");
  const response = await fetch(
    `https://${domain}/v1/datasets/_apl?format=tabular`,
    {
      body: JSON.stringify({
        apl,
        startTime: input.startedAt,
      }),
      headers: {
        Authorization: `Bearer ${input.config.token}`,
        "Content-Type": "application/json",
      },
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new Error(
      `Axiom query failed with ${response.status}: ${await response.text()}`,
    );
  }

  return rowsFromTabular((await response.json()) as unknown);
}

function quoteAplString(value: string): string {
  return JSON.stringify(value);
}

function rowsFromTabular(body: unknown): QueryRow[] {
  assertRecord(body, "Axiom query response");
  const response = body as AxiomTabularResponse;
  const table = response.tables?.[0];

  if (!table) {
    return [];
  }

  const fields = table.fields ?? [];
  const columns = table.columns ?? [];
  const fieldNames = fields.map((field) => field.name);
  const rowCount = Math.max(0, ...columns.map((column) => column.length));
  const rows: QueryRow[] = [];

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const row: QueryRow = {};

    for (
      let columnIndex = 0;
      columnIndex < fieldNames.length;
      columnIndex += 1
    ) {
      const fieldName = fieldNames[columnIndex];

      if (fieldName) {
        row[fieldName] = columns[columnIndex]?.[rowIndex];
      }
    }

    rows.push(row);
  }

  return rows;
}

function assertRows(
  rows: readonly QueryRow[],
  input: {
    expectedMessages: readonly string[];
    filteredInfoMessage: string;
    runPrefix: string;
    secrets: Record<string, string>;
  },
): void {
  for (const expectedMessage of input.expectedMessages) {
    assert.ok(findRow(rows, expectedMessage), `Missing ${expectedMessage}.`);
  }

  assert.equal(
    findRow(rows, input.filteredInfoMessage),
    undefined,
    "Info event from warn-level logger should have been filtered.",
  );

  for (const level of logLevels) {
    const directRow = requireRow(
      rows,
      message(input.runPrefix, `direct.level.${level}`),
    );
    assert.equal(getField(directRow, "level"), level);
    assert.equal(getField(directRow, "attributes.emittedLevel"), level);

    const proxyRow = requireRow(
      rows,
      message(input.runPrefix, `proxy.level.${level}`),
    );
    assert.equal(getField(proxyRow, "app"), "api");
    assert.equal(getField(proxyRow, "level"), level);
    assert.equal(getField(proxyRow, "attributes.clientApp"), "web");
    assert.equal(getField(proxyRow, "attributes.source"), "log-proxy");
    assert.equal(getField(proxyRow, "context.proxyContext"), "client-value");
  }

  const childRow = requireRow(
    rows,
    message(input.runPrefix, "direct.child-context"),
  );
  assert.equal(getField(childRow, "context.childContext"), "child-value");

  const directErrorRow = requireRow(
    rows,
    message(input.runPrefix, "direct.error"),
  );
  assert.equal(getField(directErrorRow, "error.name"), "Error");
  assert.equal(getField(directErrorRow, "error.message"), "Direct live error");

  const proxyErrorRow = requireRow(
    rows,
    message(input.runPrefix, "proxy.error"),
  );
  assert.equal(
    getField(proxyErrorRow, "attributes.clientError.name"),
    "TypeError",
  );
  assert.equal(
    getField(proxyErrorRow, "attributes.clientError.message"),
    "Proxy client live error",
  );

  const operationSuccessRow = requireRow(
    rows,
    `${message(input.runPrefix, "direct.operation.success")}.succeeded`,
  );
  assert.equal(getField(operationSuccessRow, "attributes.outcome"), "success");
  assert.equal(
    getField(operationSuccessRow, "attributes.operation"),
    message(input.runPrefix, "direct.operation.success"),
  );
  assert.ok(
    typeof getField(operationSuccessRow, "attributes.durationMs") === "number",
    "Operation success duration should be numeric.",
  );

  const operationFailureRow = requireRow(
    rows,
    `${message(input.runPrefix, "direct.operation.failure")}.failed`,
  );
  assert.equal(getField(operationFailureRow, "attributes.outcome"), "failure");
  assert.equal(
    getField(operationFailureRow, "error.message"),
    "Direct operation failure",
  );

  const rowJson = JSON.stringify(rows);
  for (const secret of Object.values(input.secrets)) {
    assert.ok(
      !rowJson.includes(secret),
      `Secret leaked into Axiom rows: ${secret}`,
    );
  }
  assert.ok(
    rowJson.includes("[REDACTED]"),
    "Expected redacted values to be present in queried rows.",
  );
}

function findRow(
  rows: readonly QueryRow[],
  eventMessage: string,
): QueryRow | undefined {
  return rows.find((row) => getField(row, "message") === eventMessage);
}

function requireRow(rows: readonly QueryRow[], eventMessage: string): QueryRow {
  const row = findRow(rows, eventMessage);
  assert.ok(row, `Missing ${eventMessage}.`);

  return row;
}

function getField(row: QueryRow, path: string): unknown {
  if (Object.hasOwn(row, path)) {
    return row[path];
  }

  let current: unknown = row;

  for (const segment of path.split(".")) {
    if (!isRecord(current) || !(segment in current)) {
      return undefined;
    }

    current = current[segment];
  }

  return current;
}

function assertRecord(
  value: unknown,
  label: string,
): asserts value is QueryRow {
  assert.ok(isRecord(value), `${label} must be an object.`);
}

function isRecord(value: unknown): value is QueryRow {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
