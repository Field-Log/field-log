import { isLogLevel, type LogEvent, loggerValues } from "@package/logger";

export const maxClientLogBatchSize = loggerValues.logProxy.maxBatchSize;

export function parseClientLogEvents(
  body: unknown,
): { ok: true; value: LogEvent[] } | { error: string; ok: false } {
  const events = unwrapLogEvents(body);

  if (!Array.isArray(events)) {
    return { error: "Expected a log event or an event batch.", ok: false };
  }

  if (events.length === 0) {
    return { error: "Expected at least one log event.", ok: false };
  }

  if (events.length > maxClientLogBatchSize) {
    return {
      error: `Log batches are limited to ${maxClientLogBatchSize} events.`,
      ok: false,
    };
  }

  const normalizedEvents: LogEvent[] = [];

  for (const event of events) {
    const normalizedEvent = normalizeClientLogEvent(event);

    if (!normalizedEvent.ok) {
      return normalizedEvent;
    }

    normalizedEvents.push(normalizedEvent.value);
  }

  return { ok: true, value: normalizedEvents };
}

function unwrapLogEvents(body: unknown): unknown {
  if (Array.isArray(body)) {
    return body;
  }

  if (isRecord(body) && Array.isArray(body.events)) {
    return body.events;
  }

  return [body];
}

function normalizeClientLogEvent(
  event: unknown,
): { ok: true; value: LogEvent } | { error: string; ok: false } {
  if (!isRecord(event)) {
    return { error: "Log event must be an object.", ok: false };
  }

  if (!isShortString(event.app)) {
    return { error: "Log event app must be a string.", ok: false };
  }

  if (!isShortString(event.environment)) {
    return { error: "Log event environment must be a string.", ok: false };
  }

  if (!isLogLevel(event.level)) {
    return { error: "Log event level is invalid.", ok: false };
  }

  if (!isShortString(event.message, 500)) {
    return { error: "Log event message must be a string.", ok: false };
  }

  if (event.timestamp !== undefined && typeof event.timestamp !== "string") {
    return { error: "Log event timestamp must be a string.", ok: false };
  }

  if (event.attributes !== undefined && !isRecord(event.attributes)) {
    return { error: "Log event attributes must be an object.", ok: false };
  }

  if (event.context !== undefined && !isRecord(event.context)) {
    return { error: "Log event context must be an object.", ok: false };
  }

  if (event.error !== undefined && !isRecord(event.error)) {
    return { error: "Log event error must be an object.", ok: false };
  }

  const normalizedEvent: LogEvent = {
    app: event.app,
    environment: event.environment,
    level: event.level,
    message: event.message,
    timestamp: event.timestamp ?? new Date().toISOString(),
  };

  if (event.attributes) {
    normalizedEvent.attributes = event.attributes;
  }

  if (event.context) {
    normalizedEvent.context = event.context;
  }

  if (event.error) {
    normalizedEvent.error = {
      message: String(event.error.message ?? "Client error"),
      name: String(event.error.name ?? "Error"),
      stack:
        typeof event.error.stack === "string" ? event.error.stack : undefined,
    };
  }

  if (event.rawPayload !== undefined) {
    normalizedEvent.rawPayload = event.rawPayload;
  }

  return {
    ok: true,
    value: normalizedEvent,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isShortString(value: unknown, maxLength = 64): value is string {
  return (
    typeof value === "string" && value.length > 0 && value.length <= maxLength
  );
}
