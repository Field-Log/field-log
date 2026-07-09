import { loggerValues } from "./constants/logger.js";

export { loggerMessages, loggerValues } from "./constants/logger.js";

export const logLevelWeights = {
  trace: 10,
  debug: 20,
  verbose: 30,
  info: 40,
  warn: 50,
  error: 60,
  fatal: 70,
} as const;

export type LogLevel = keyof typeof logLevelWeights;

export const logLevels = Object.keys(logLevelWeights) as LogLevel[];

export type LogContext = Record<string, unknown>;

export type SerializedError = {
  cause?: unknown;
  message: string;
  name: string;
  stack?: string;
};

export type LogEvent = {
  app: string;
  attributes?: LogContext;
  console?: ConsoleLogOptions;
  context?: LogContext;
  environment: string;
  error?: SerializedError;
  level: LogLevel;
  message: string;
  rawPayload?: unknown;
  timestamp: string;
};

export type ConsoleLogOptions = {
  mode?: ConsoleTransportMode;
};

export type LogData = {
  attributes?: LogContext;
  console?: ConsoleLogOptions;
  context?: LogContext;
  error?: unknown;
  includeRawPayload?: boolean;
  rawPayload?: unknown;
};

export type LogTransport = {
  flush?: () => Promise<void> | void;
  log: (event: LogEvent) => Promise<void> | void;
};

export type ConsoleTransportMode = "compact" | "verbose";

export type ConsoleTransportConfig = {
  mode?: ConsoleTransportMode;
  writer?: {
    error: (message?: unknown, ...optionalParams: unknown[]) => void;
    log: (message?: unknown, ...optionalParams: unknown[]) => void;
    warn: (message?: unknown, ...optionalParams: unknown[]) => void;
  };
};

export type Logger = {
  child: (context: LogContext) => Logger;
  debug: (message: string, data?: LogData) => void;
  error: (message: string, data?: LogData) => void;
  fatal: (message: string, data?: LogData) => void;
  flush: () => Promise<void>;
  info: (message: string, data?: LogData) => void;
  operation: <T>(
    name: string,
    action: () => T | Promise<T>,
    data?: LogData,
  ) => Promise<T>;
  trace: (message: string, data?: LogData) => void;
  verbose: (message: string, data?: LogData) => void;
  warn: (message: string, data?: LogData) => void;
};

export type LoggerConfig = {
  app: string;
  context?: LogContext;
  environment: string;
  level?: LogLevel;
  redactKeys?: readonly string[];
  transports?: readonly LogTransport[];
};

export type FetchResponse = {
  ok: boolean;
  status: number;
  text?: () => Promise<string>;
};

export type FetchLike = (
  input: string,
  init?: {
    body?: string;
    headers?: Record<string, string>;
    method?: string;
  },
) => Promise<FetchResponse>;

export type AxiomTransportConfig = {
  dataset: string;
  edgeDomain?: string;
  fetch?: FetchLike;
  token: string;
};

export type ProxyTransportConfig = {
  clientKey?: string;
  fetch?: FetchLike;
  url: string;
};

const redactedValue = "[REDACTED]";

const defaultRedactKeys = [
  "authorization",
  "apiKey",
  "clientSecret",
  "connectionString",
  "cookie",
  "databaseUrl",
  "jwt",
  "passphrase",
  "password",
  "privateKey",
  "secret",
  "session",
  "token",
] as const;

export function isLogLevel(value: unknown): value is LogLevel {
  return typeof value === "string" && value in logLevelWeights;
}

export function normalizeLogLevel(value: string | undefined): LogLevel {
  return isLogLevel(value) ? value : "info";
}

export function normalizeConsoleTransportMode(
  value: string | undefined,
): ConsoleTransportMode {
  return value === "verbose" ? "verbose" : "compact";
}

export function redactValue(
  value: unknown,
  extraKeys: readonly string[] = [],
): unknown {
  return redactUnknown(
    value,
    createRedactSet(extraKeys),
    new WeakSet<object>(),
  );
}

export function serializeError(error: unknown): SerializedError {
  if (error instanceof Error) {
    return {
      cause: error.cause ? redactValue(error.cause) : undefined,
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }

  return {
    message: String(error),
    name: "Error",
  };
}

export function summarizeDbPayload(payload: unknown): LogContext {
  return summarizePayload("db", payload);
}

export function summarizeApiPayload(payload: unknown): LogContext {
  return summarizePayload("api", payload);
}

export function createNoopLogger(config: Partial<LoggerConfig> = {}): Logger {
  return createLogger({
    app: config.app ?? "unknown",
    context: config.context,
    environment: config.environment ?? "unknown",
    level: config.level,
    redactKeys: config.redactKeys,
    transports: [],
  });
}

export function createLogger(config: LoggerConfig): Logger {
  const level = config.level ?? "info";
  const transports = [...(config.transports ?? [])];
  const redactKeys = [...(config.redactKeys ?? [])];
  const baseContext = { ...(config.context ?? {}) };
  const pending = new Set<Promise<void>>();

  const emit = (
    eventLevel: LogLevel,
    message: string,
    data?: LogData,
  ): void => {
    if (logLevelWeights[eventLevel] < logLevelWeights[level]) {
      return;
    }

    const event: LogEvent = {
      app: config.app,
      environment: config.environment,
      level: eventLevel,
      message,
      timestamp: new Date().toISOString(),
    };

    const context = redactValue(
      {
        ...baseContext,
        ...(data?.context ?? {}),
      },
      redactKeys,
    );

    if (hasKeys(context)) {
      event.context = context;
    }

    if (data?.attributes) {
      const attributes = redactValue(data.attributes, redactKeys);
      if (hasKeys(attributes)) {
        event.attributes = attributes;
      }
    }

    if (data?.error) {
      event.error = serializeError(data.error);
    }

    if (data?.includeRawPayload) {
      event.rawPayload = redactValue(data.rawPayload, redactKeys);
    }

    if (data?.console) {
      event.console = data.console;
    }

    for (const transport of transports) {
      const task = Promise.resolve(transport.log(event)).catch(() => undefined);
      pending.add(task);
      task.then(
        () => pending.delete(task),
        () => pending.delete(task),
      );
    }
  };

  const logger: Logger = {
    child(context) {
      return createLogger({
        ...config,
        context: {
          ...baseContext,
          ...context,
        },
        transports,
      });
    },
    debug(message, data) {
      emit("debug", message, data);
    },
    error(message, data) {
      emit("error", message, data);
    },
    fatal(message, data) {
      emit("fatal", message, data);
    },
    async flush() {
      await Promise.all([...pending]);
      await Promise.all(transports.map((transport) => transport.flush?.()));
    },
    info(message, data) {
      emit("info", message, data);
    },
    async operation(name, action, data) {
      const startedAt = Date.now();

      try {
        const result = await action();
        emit("info", `${name}.succeeded`, {
          ...data,
          attributes: {
            ...(data?.attributes ?? {}),
            durationMs: Date.now() - startedAt,
            operation: name,
            outcome: "success",
          },
        });
        return result;
      } catch (error) {
        emit("error", `${name}.failed`, {
          ...data,
          attributes: {
            ...(data?.attributes ?? {}),
            durationMs: Date.now() - startedAt,
            operation: name,
            outcome: "failure",
          },
          error,
        });
        throw error;
      }
    },
    trace(message, data) {
      emit("trace", message, data);
    },
    verbose(message, data) {
      emit("verbose", message, data);
    },
    warn(message, data) {
      emit("warn", message, data);
    },
  };

  return logger;
}

export function createConsoleTransport(
  config: ConsoleTransportConfig = {},
): LogTransport {
  const mode = config.mode ?? "compact";
  const writer = config.writer ?? console;

  return {
    log(event) {
      const eventMode = event.console?.mode ?? mode;
      const eventForOutput = omitConsoleOptions(event);
      const output =
        eventMode === "verbose"
          ? {
              ...eventForOutput,
              levelWeight: logLevelWeights[event.level],
            }
          : compactConsoleEvent(eventForOutput);
      const line = JSON.stringify(output);

      if (event.level === "fatal" || event.level === "error") {
        writer.error(line);
        return;
      }

      if (event.level === "warn") {
        writer.warn(line);
        return;
      }

      writer.log(line);
    },
  };
}

export function createAxiomTransport(
  config: AxiomTransportConfig,
): LogTransport {
  return {
    async log(event) {
      const fetcher = config.fetch ?? getGlobalFetch();
      const domain = config.edgeDomain ?? "api.axiom.co";
      const eventForIngest = omitConsoleOptions(event);
      const response = await fetcher(
        `https://${domain}/v1/datasets/${encodeURIComponent(
          config.dataset,
        )}/ingest`,
        {
          body: JSON.stringify([eventForIngest]),
          headers: {
            Authorization: `Bearer ${config.token}`,
            "Content-Type": "application/json",
          },
          method: "POST",
        },
      );

      if (!response.ok) {
        const body = await response.text?.();
        throw new Error(
          `Axiom ingest failed with ${response.status}${body ? `: ${body}` : ""}`,
        );
      }
    },
  };
}

export function createProxyTransport(
  config: ProxyTransportConfig,
): LogTransport {
  return {
    async log(event) {
      const fetcher = config.fetch ?? getGlobalFetch();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (config.clientKey) {
        headers[loggerValues.logProxy.clientKeyHeader] = config.clientKey;
      }

      const response = await fetcher(config.url, {
        body: JSON.stringify({
          events: [omitConsoleOptions(event)],
        }),
        headers,
        method: "POST",
      });

      if (!response.ok) {
        const body = await response.text?.();
        throw new Error(
          `Log proxy failed with ${response.status}${body ? `: ${body}` : ""}`,
        );
      }
    },
  };
}

function omitConsoleOptions(event: LogEvent): Omit<LogEvent, "console"> {
  const { console: consoleOptions, ...eventForTransport } = event;
  void consoleOptions;

  return eventForTransport;
}

function createRedactSet(extraKeys: readonly string[]): Set<string> {
  return new Set(
    [...defaultRedactKeys, ...extraKeys].map((key) => normalizeKey(key)),
  );
}

function compactConsoleEvent(event: LogEvent): LogContext {
  const output: LogContext = {
    app: event.app,
    environment: event.environment,
    level: event.level,
    message: event.message,
    timestamp: event.timestamp,
  };

  copyKnownFields(output, event.context, [
    "requestId",
    "traceId",
    "spanId",
    "route",
  ]);
  copyKnownFields(output, event.attributes, [
    "source",
    "route",
    "method",
    "status",
    "statusCode",
    "operation",
    "outcome",
    "durationMs",
    "clientApp",
    "clientEnvironment",
  ]);

  const error = compactError(event);

  if (error) {
    output.error = error;
  }

  return output;
}

function compactError(event: LogEvent): LogContext | undefined {
  if (event.error) {
    return {
      message: event.error.message,
      name: event.error.name,
    };
  }

  const clientError = event.attributes?.clientError;

  if (!isPlainRecord(clientError)) {
    return undefined;
  }

  return {
    message: String(clientError.message ?? "Client error"),
    name: String(clientError.name ?? "Error"),
  };
}

function copyKnownFields(
  output: LogContext,
  source: LogContext | undefined,
  keys: readonly string[],
): void {
  if (!source) {
    return;
  }

  for (const key of keys) {
    const value = source[key];

    if (value !== undefined) {
      output[key] = value;
    }
  }
}

function redactUnknown(
  value: unknown,
  redactKeys: Set<string>,
  seen: WeakSet<object>,
): unknown {
  if (!value || typeof value !== "object") {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return serializeError(value);
  }

  if (seen.has(value)) {
    return "[Circular]";
  }

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => redactUnknown(item, redactKeys, seen));
  }

  const result: Record<string, unknown> = {};

  for (const [key, item] of Object.entries(value)) {
    result[key] = redactKeys.has(normalizeKey(key))
      ? redactedValue
      : redactUnknown(item, redactKeys, seen);
  }

  return result;
}

function normalizeKey(key: string): string {
  return key.replaceAll(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

function hasKeys(value: unknown): value is LogContext {
  return isPlainRecord(value) && Object.keys(value).length > 0;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function summarizePayload(kind: "api" | "db", payload: unknown): LogContext {
  const redactedPayload = redactValue(payload);

  if (!redactedPayload || typeof redactedPayload !== "object") {
    return {
      kind,
      type: typeof redactedPayload,
    };
  }

  if (Array.isArray(redactedPayload)) {
    return {
      kind,
      length: redactedPayload.length,
      type: "array",
    };
  }

  const keys = Object.keys(redactedPayload);

  return {
    kind,
    keyCount: keys.length,
    keys: keys.slice(0, 20),
    type: "object",
  };
}

function getGlobalFetch(): FetchLike {
  const fetcher = (globalThis as { fetch?: FetchLike }).fetch;

  if (!fetcher) {
    throw new Error("A fetch implementation is required for this transport.");
  }

  return fetcher;
}
