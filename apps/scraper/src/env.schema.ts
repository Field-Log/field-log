import { createEnv, type StandardSchemaV1 } from "@t3-oss/env-core";
import { z } from "zod";

export type ScraperRuntimeEnv = {
  APP_ENV?: string;
  AXIOM_DATASET?: string;
  AXIOM_EDGE_DOMAIN?: string;
  AXIOM_TOKEN?: string;
  DATABASE_URL?: string;
  IMAGE_KIT_PRIVATE_KEY?: string;
  IMAGE_KIT_PUBLIC_KEY?: string;
  IMAGE_KIT_URL_ENDPOINT?: string;
  LOGGER?: string;
  LOG_LEVEL?: string;
  PORT?: string;
  REDIS_URL?: string;
  SCRAPER_DRY_RUN?: string;
  SCRAPER_IMAGE_BATCH_SIZE?: string;
  SCRAPER_ITEM_BATCH_SIZE?: string;
  SCRAPER_QUEUE_CONCURRENCY?: string;
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
  AXIOM_DATASET: z.string().min(1).optional(),
  AXIOM_EDGE_DOMAIN: z.string().min(1).optional(),
  AXIOM_TOKEN: z.string().min(1).optional(),
  LOGGER: z.string().min(1).optional(),
  LOG_LEVEL: z.string().min(1).optional(),
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

export function createScraperJobEnv(runtimeEnv: ScraperRuntimeEnv) {
  return createEnv({
    emptyStringAsUndefined: true,
    isServer: true,
    onValidationError(issues) {
      throw new ScraperEnvValidationError(issues);
    },
    runtimeEnvStrict: getScraperRuntimeEnvStrict(runtimeEnv),
    server: {
      ...scraperServerSchema,
      DATABASE_URL: z.string().min(1).url(),
      IMAGE_KIT_PRIVATE_KEY: z.string().min(1).optional(),
      IMAGE_KIT_PUBLIC_KEY: z.string().min(1).optional(),
      IMAGE_KIT_URL_ENDPOINT: z.string().min(1).url().optional(),
      REDIS_URL: z.string().min(1).url(),
      SCRAPER_DRY_RUN: z
        .enum(["true", "false"])
        .optional()
        .transform((value) => value === "true"),
      SCRAPER_IMAGE_BATCH_SIZE: z.coerce
        .number()
        .int()
        .min(1)
        .max(500)
        .default(25),
      SCRAPER_ITEM_BATCH_SIZE: z.coerce
        .number()
        .int()
        .min(1)
        .max(1_000)
        .default(100),
      SCRAPER_QUEUE_CONCURRENCY: z.coerce
        .number()
        .int()
        .min(1)
        .max(20)
        .default(3),
    },
  });
}

function getScraperRuntimeEnvStrict(runtimeEnv: ScraperRuntimeEnv) {
  return {
    APP_ENV: runtimeEnv.APP_ENV,
    AXIOM_DATASET: runtimeEnv.AXIOM_DATASET,
    AXIOM_EDGE_DOMAIN: runtimeEnv.AXIOM_EDGE_DOMAIN,
    AXIOM_TOKEN: runtimeEnv.AXIOM_TOKEN,
    DATABASE_URL: runtimeEnv.DATABASE_URL,
    IMAGE_KIT_PRIVATE_KEY: runtimeEnv.IMAGE_KIT_PRIVATE_KEY,
    IMAGE_KIT_PUBLIC_KEY: runtimeEnv.IMAGE_KIT_PUBLIC_KEY,
    IMAGE_KIT_URL_ENDPOINT: runtimeEnv.IMAGE_KIT_URL_ENDPOINT,
    LOGGER: runtimeEnv.LOGGER,
    LOG_LEVEL: runtimeEnv.LOG_LEVEL,
    PORT: runtimeEnv.PORT,
    REDIS_URL: runtimeEnv.REDIS_URL,
    SCRAPER_DRY_RUN: runtimeEnv.SCRAPER_DRY_RUN,
    SCRAPER_IMAGE_BATCH_SIZE: runtimeEnv.SCRAPER_IMAGE_BATCH_SIZE,
    SCRAPER_ITEM_BATCH_SIZE: runtimeEnv.SCRAPER_ITEM_BATCH_SIZE,
    SCRAPER_QUEUE_CONCURRENCY: runtimeEnv.SCRAPER_QUEUE_CONCURRENCY,
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
