import { createEnv, type StandardSchemaV1 } from "@t3-oss/env-core";
import { z } from "zod";

export type ScraperRuntimeEnv = {
  APP_ENV?: string;
  PORT?: string;
};

export type ScraperEnvValidationIssue = {
  message: string;
  variable: string;
};

export class ScraperEnvValidationError extends Error {
  readonly issues: readonly ScraperEnvValidationIssue[];
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
    this.name = "ScraperEnvValidationError";
    this.issues = validationIssues;
    this.variables = variables;
  }
}

const scraperServerSchema = {
  APP_ENV: z.string().min(1).optional(),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4007),
} as const;

export function createScraperEnv(runtimeEnv: ScraperRuntimeEnv) {
  return createEnv({
    emptyStringAsUndefined: true,
    isServer: true,
    onValidationError(issues) {
      throw new ScraperEnvValidationError(issues);
    },
    runtimeEnvStrict: getScraperRuntimeEnvStrict(runtimeEnv),
    server: scraperServerSchema,
  });
}

function getScraperRuntimeEnvStrict(runtimeEnv: ScraperRuntimeEnv) {
  return {
    APP_ENV: runtimeEnv.APP_ENV,
    PORT: runtimeEnv.PORT,
  };
}

function formatValidationIssue(
  issue: StandardSchemaV1.Issue,
): ScraperEnvValidationIssue {
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
