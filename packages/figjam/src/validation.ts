import {
  type FigjamOperation,
  type FigjamPayload,
  payloadSchemaVersion,
} from "./types.js";

export class FigjamValidationError extends Error {
  override name = "FigjamValidationError";
}

export function parseAllowedFileKeys(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);
}

export function assertAllowedFileKey(
  fileKey: string,
  allowedFileKeys: readonly string[],
): void {
  if (!allowedFileKeys.includes(fileKey)) {
    throw new FigjamValidationError(
      `File key ${fileKey} is not in FIGMA_FIGJAM_ALLOWED_FILE_KEYS.`,
    );
  }
}

export function validatePayload(
  input: unknown,
  options: { allowedFileKeys?: readonly string[] } = {},
): FigjamPayload {
  const payload = expectObject(input, "payload");

  expectString(payload.schemaVersion, "schemaVersion");
  if (payload.schemaVersion !== payloadSchemaVersion) {
    throw new FigjamValidationError(
      `schemaVersion must be ${payloadSchemaVersion}.`,
    );
  }

  const payloadId = expectString(payload.payloadId, "payloadId");
  const fileKey = expectString(payload.fileKey, "fileKey");
  const source = expectObject(payload.source, "source");
  const agent = expectString(source.agent, "source.agent");
  const createdAt = expectString(source.createdAt, "source.createdAt");
  const operations = expectArray(payload.operations, "operations");

  if (!["claude", "codex", "system", "user"].includes(agent)) {
    throw new FigjamValidationError(
      "source.agent must be codex, claude, user, or system.",
    );
  }

  if (Number.isNaN(Date.parse(createdAt))) {
    throw new FigjamValidationError("source.createdAt must be an ISO date.");
  }

  if (operations.length === 0) {
    throw new FigjamValidationError("operations must not be empty.");
  }

  if (operations.length > 500) {
    throw new FigjamValidationError(
      "operations must contain at most 500 items.",
    );
  }

  if (options.allowedFileKeys) {
    assertAllowedFileKey(fileKey, options.allowedFileKeys);
  }

  const operationIds = new Set<string>();
  const validatedOperations = operations.map((operation, index) => {
    const validated = validateOperation(operation, index);
    if (operationIds.has(validated.id)) {
      throw new FigjamValidationError(
        `operations[${index}].id duplicates ${validated.id}.`,
      );
    }
    operationIds.add(validated.id);
    return validated;
  });

  return {
    fileKey,
    operations: validatedOperations,
    payloadId,
    schemaVersion: payloadSchemaVersion,
    source: {
      agent: agent as FigjamPayload["source"]["agent"],
      branch: optionalString(source.branch, "source.branch"),
      commit: optionalString(source.commit, "source.commit"),
      createdAt,
      task: optionalString(source.task, "source.task"),
    },
  };
}

function validateOperation(input: unknown, index: number): FigjamOperation {
  const operation = expectObject(input, `operations[${index}]`);
  const type = expectString(operation.type, `operations[${index}].type`);
  const id = expectString(operation.id, `operations[${index}].id`);

  switch (type) {
    case "section":
      return {
        height: expectFiniteNumber(
          operation.height,
          `operations[${index}].height`,
        ),
        id,
        title: expectString(operation.title, `operations[${index}].title`),
        type,
        width: expectFiniteNumber(
          operation.width,
          `operations[${index}].width`,
        ),
        x: expectFiniteNumber(operation.x, `operations[${index}].x`),
        y: expectFiniteNumber(operation.y, `operations[${index}].y`),
      };
    case "sticky":
      return {
        color: optionalStickyColor(
          operation.color,
          `operations[${index}].color`,
        ),
        id,
        text: expectString(operation.text, `operations[${index}].text`),
        type,
        x: expectFiniteNumber(operation.x, `operations[${index}].x`),
        y: expectFiniteNumber(operation.y, `operations[${index}].y`),
      };
    case "shape":
      return {
        fill: optionalColor(operation.fill, `operations[${index}].fill`),
        fontSize: optionalPositiveNumber(
          operation.fontSize,
          `operations[${index}].fontSize`,
        ),
        height: expectFiniteNumber(
          operation.height,
          `operations[${index}].height`,
        ),
        id,
        radius: optionalNonNegativeNumber(
          operation.radius,
          `operations[${index}].radius`,
        ),
        stroke: optionalColor(operation.stroke, `operations[${index}].stroke`),
        text: optionalString(operation.text, `operations[${index}].text`),
        textAlign: optionalShapeTextAlign(
          operation.textAlign,
          `operations[${index}].textAlign`,
        ),
        textColor: optionalColor(
          operation.textColor,
          `operations[${index}].textColor`,
        ),
        textPadding: optionalNonNegativeNumber(
          operation.textPadding,
          `operations[${index}].textPadding`,
        ),
        textPosition: optionalShapeTextPosition(
          operation.textPosition,
          `operations[${index}].textPosition`,
        ),
        type,
        width: expectFiniteNumber(
          operation.width,
          `operations[${index}].width`,
        ),
        x: expectFiniteNumber(operation.x, `operations[${index}].x`),
        y: expectFiniteNumber(operation.y, `operations[${index}].y`),
      };
    case "connector":
      return {
        from: expectString(operation.from, `operations[${index}].from`),
        id,
        text: optionalString(operation.text, `operations[${index}].text`),
        to: expectString(operation.to, `operations[${index}].to`),
        type,
      };
    case "stamp":
      return {
        id,
        text: expectString(operation.text, `operations[${index}].text`),
        type,
        x: expectFiniteNumber(operation.x, `operations[${index}].x`),
        y: expectFiniteNumber(operation.y, `operations[${index}].y`),
      };
    default:
      throw new FigjamValidationError(
        `operations[${index}].type is not supported: ${type}.`,
      );
  }
}

function expectArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new FigjamValidationError(`${path} must be an array.`);
  }

  return value;
}

function expectObject(value: unknown, path: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new FigjamValidationError(`${path} must be an object.`);
  }

  return value as Record<string, unknown>;
}

function expectFiniteNumber(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new FigjamValidationError(`${path} must be a finite number.`);
  }

  return value;
}

function expectString(value: unknown, path: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new FigjamValidationError(`${path} must be a non-empty string.`);
  }

  return value;
}

function optionalString(value: unknown, path: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  return expectString(value, path);
}

function optionalColor(value: unknown, path: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const color = expectString(value, path);
  if (color === "none" || /^#[0-9a-f]{6}$/i.test(color)) {
    return color;
  }

  throw new FigjamValidationError(
    `${path} must be "none" or a six-digit hex color.`,
  );
}

function optionalPositiveNumber(
  value: unknown,
  path: string,
): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  const number = expectFiniteNumber(value, path);
  if (number > 0) {
    return number;
  }

  throw new FigjamValidationError(`${path} must be greater than 0.`);
}

function optionalNonNegativeNumber(
  value: unknown,
  path: string,
): number | undefined {
  if (value === undefined) {
    return undefined;
  }

  const number = expectFiniteNumber(value, path);
  if (number >= 0) {
    return number;
  }

  throw new FigjamValidationError(
    `${path} must be greater than or equal to 0.`,
  );
}

function optionalShapeTextAlign(
  value: unknown,
  path: string,
): "center" | "left" | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === "center" || value === "left") {
    return value;
  }

  throw new FigjamValidationError(`${path} must be center or left.`);
}

function optionalShapeTextPosition(
  value: unknown,
  path: string,
): "center" | "top-left" | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === "center" || value === "top-left") {
    return value;
  }

  throw new FigjamValidationError(`${path} must be center or top-left.`);
}

function optionalStickyColor(
  value: unknown,
  path: string,
): FigjamOperation extends infer Operation
  ? Operation extends { color?: infer Color }
    ? Color
    : never
  : never {
  if (value === undefined) {
    return undefined as never;
  }

  if (
    value === "blue" ||
    value === "green" ||
    value === "pink" ||
    value === "yellow"
  ) {
    return value as never;
  }

  throw new FigjamValidationError(
    `${path} must be blue, green, pink, or yellow.`,
  );
}
