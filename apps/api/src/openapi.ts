import type { OpenAPIGeneratorOptions } from "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";
import { loggerValues, logLevels } from "@package/logger";

export const openApiJsonPath = "/api/v1/openapi.json";
export const apiDocsPath = "/api/v1/docs";

export const openApiDocumentConfig = {
  openapi: "3.1.0",
  info: {
    title: "Field Log API",
    version: "0.0.0",
    description: "API documentation for Field Log services.",
  },
  servers: [
    {
      url: "https://api.field-log.app",
      description: "Production",
    },
    {
      url: "https://api.staging.field-log.app",
      description: "Staging",
    },
    {
      url: "http://localhost:4006",
      description: "Local development",
    },
  ],
};

export const openApiGeneratorOptions = {
  unionPreferredType: "oneOf",
} satisfies OpenAPIGeneratorOptions;

export const jsonContent = (schema: z.ZodType) => ({
  "application/json": {
    schema,
  },
});

export const HealthResponseSchema = z
  .object({
    ok: z.boolean().openapi({
      example: true,
    }),
    service: z.string().openapi({
      example: "api",
    }),
  })
  .openapi("HealthResponse");

export const ErrorResponseSchema = z
  .object({
    error: z.string().openapi({
      example: "Expected a JSON request body.",
    }),
  })
  .openapi("ErrorResponse");

export const ClientLogAcceptedResponseSchema = z
  .object({
    accepted: z.number().int().nonnegative().openapi({
      example: 1,
    }),
  })
  .openapi("ClientLogAcceptedResponse");

const UnknownRecordSchema = z.record(z.string(), z.unknown());

const ClientErrorSchema = z
  .object({
    message: z.string().optional().openapi({
      example: "Something went wrong.",
    }),
    name: z.string().optional().openapi({
      example: "Error",
    }),
    stack: z.string().optional(),
  })
  .catchall(z.unknown())
  .openapi("ClientLogError");

export const ClientLogEventSchema = z
  .object({
    app: z.string().min(1).max(64).openapi({
      example: "web",
    }),
    attributes: UnknownRecordSchema.optional(),
    context: UnknownRecordSchema.optional(),
    environment: z.string().min(1).max(64).openapi({
      example: "production",
    }),
    error: ClientErrorSchema.optional(),
    level: z.enum(logLevels).openapi({
      example: "info",
    }),
    message: z.string().min(1).max(500).openapi({
      example: "client.clicked",
    }),
    rawPayload: z.unknown().optional(),
    timestamp: z.string().optional().openapi({
      example: "2026-01-01T00:00:00.000Z",
    }),
  })
  .openapi("ClientLogEvent");

export const ClientLogBatchSchema = z
  .object({
    events: z
      .array(ClientLogEventSchema)
      .min(1)
      .max(loggerValues.logProxy.maxBatchSize),
  })
  .openapi("ClientLogBatch");

export const ClientLogRequestSchema = z
  .union([
    ClientLogEventSchema,
    z
      .array(ClientLogEventSchema)
      .min(1)
      .max(loggerValues.logProxy.maxBatchSize),
    ClientLogBatchSchema,
  ])
  .openapi("ClientLogRequest");

export const ClientLogHeadersSchema = z.object({
  [loggerValues.logProxy.clientKeyHeader]: z
    .string()
    .optional()
    .openapi({
      param: {
        name: loggerValues.logProxy.clientKeyHeader,
        in: "header",
        required: false,
      },
      description:
        "Optional client key. Required only when LOG_PROXY_CLIENT_KEY is configured.",
    }),
});
