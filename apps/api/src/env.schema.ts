import { createEnv, type StandardSchemaV1 } from "@t3-oss/env-core";
import { z } from "zod";

export type ApiRuntimeEnv = {
  APP_ENV?: string;
  AXIOM_DATASET?: string;
  AXIOM_EDGE_DOMAIN?: string;
  AXIOM_TOKEN?: string;
  DATABASE_URL?: string;
  LOGGER?: string;
  LOG_LEVEL?: string;
  LOG_PROXY_CLIENT_KEY?: string;
  PORT?: string;
};

export type ApiEnvValidationIssue = {
  message: string;
  variable: string;
};

export class ApiEnvValidationError extends Error {
  readonly issues: readonly ApiEnvValidationIssue[];
  readonly variables: readonly string[];

  constructor(issues: readonly StandardSchemaV1.Issue[]) {
    const validationIssues = issues.map(formatValidationIssue);
    const variables = [
      ...new Set(validationIssues.map((issue) => issue.variable)),
    ];
    super(
      `Invalid environment variables: ${
        variables.length > 0 ? variables.join(", ") : "unknown"
      }`,
    );
    this.name = "ApiEnvValidationError";
    this.issues = validationIssues;
    this.variables = variables;
  }
}

const apiServerSchema = {
  APP_ENV: z.string().min(1).optional(),
  AXIOM_DATASET: z.string().min(1).optional(),
  AXIOM_EDGE_DOMAIN: z.string().min(1).optional(),
  AXIOM_TOKEN: z.string().min(1).optional(),
  DATABASE_URL: z.string().min(1).url(),
  LOGGER: z.enum(["compact", "verbose"]).optional(),
  LOG_LEVEL: z
    .enum(["trace", "debug", "verbose", "info", "warn", "error", "fatal"])
    .optional(),
  LOG_PROXY_CLIENT_KEY: z.string().min(1).optional(),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4006),
} as const;

export function createApiEnv(runtimeEnv: ApiRuntimeEnv) {
  return createEnv({
    emptyStringAsUndefined: true,
    isServer: true,
    onValidationError(issues) {
      throw new ApiEnvValidationError(issues);
    },
    runtimeEnvStrict: getApiRuntimeEnvStrict(runtimeEnv),
    server: apiServerSchema,
  });
}

function getApiRuntimeEnvStrict(runtimeEnv: ApiRuntimeEnv) {
  return {
    APP_ENV: runtimeEnv.APP_ENV,
    AXIOM_DATASET: runtimeEnv.AXIOM_DATASET,
    AXIOM_EDGE_DOMAIN: runtimeEnv.AXIOM_EDGE_DOMAIN,
    AXIOM_TOKEN: runtimeEnv.AXIOM_TOKEN,
    DATABASE_URL: runtimeEnv.DATABASE_URL,
    LOGGER: runtimeEnv.LOGGER,
    LOG_LEVEL: runtimeEnv.LOG_LEVEL,
    LOG_PROXY_CLIENT_KEY: runtimeEnv.LOG_PROXY_CLIENT_KEY,
    PORT: runtimeEnv.PORT,
  };
}

function formatValidationIssue(
  issue: StandardSchemaV1.Issue,
): ApiEnvValidationIssue {
  return {
    message: issue.message,
    variable: getIssueVariable(issue),
  };
}

function getIssueVariable(issue: StandardSchemaV1.Issue): string {
  const [firstPathSegment] = issue.path ?? [];

  if (firstPathSegment === undefined) {
    return "unknown";
  }

  if (
    typeof firstPathSegment === "object" &&
    firstPathSegment !== null &&
    "key" in firstPathSegment
  ) {
    return String(firstPathSegment.key);
  }

  return String(firstPathSegment);
}
