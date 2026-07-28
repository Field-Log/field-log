import process from "node:process";

const requiredMapFields = [
  "attributes",
  "context",
  "error",
  "rawPayload",
] as const;

type Config = {
  dataset: string;
  domain: string;
  token: string;
};

type FetchResponse = {
  json: () => Promise<unknown>;
  ok: boolean;
  status: number;
  text: () => Promise<string>;
};

type FetchLike = (
  input: string,
  init?: {
    body?: string;
    headers?: Record<string, string>;
    method?: string;
  },
) => Promise<FetchResponse>;

async function main(): Promise<void> {
  const config = readConfig();
  await configureMapFields(config, fetch);
}

export async function configureMapFields(
  config: Config,
  fetcher: FetchLike,
): Promise<void> {
  const existingFields = await listMapFields(config, fetcher);
  const existingFieldSet = new Set(existingFields);
  const missingFields = requiredMapFields.filter(
    (field) => !existingFieldSet.has(field),
  );

  if (missingFields.length === 0) {
    console.log(
      `Axiom map fields already configured for ${config.dataset}: ${requiredMapFields.join(
        ", ",
      )}`,
    );
    return;
  }

  for (const field of missingFields) {
    await createMapField(config, fetcher, field);
    console.log(`Created Axiom map field ${config.dataset}.${field}`);
  }

  console.log(
    `Axiom map fields configured for ${config.dataset}: ${requiredMapFields.join(
      ", ",
    )}`,
  );
}

function readConfig(env: NodeJS.ProcessEnv = process.env): Config {
  return {
    dataset: requiredEnv(env, "AXIOM_DATASET"),
    domain: env.AXIOM_EDGE_DOMAIN || "api.axiom.co",
    token: requiredEnv(env, "AXIOM_TOKEN"),
  };
}

async function listMapFields(
  config: Config,
  fetcher: FetchLike,
): Promise<string[]> {
  const response = await fetcher(mapFieldsUrl(config), {
    headers: authorizationHeaders(config),
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(
      `Axiom map field lookup failed with ${response.status}: ${await response.text()}`,
    );
  }

  const body = await response.json();

  if (!Array.isArray(body) || !body.every((item) => typeof item === "string")) {
    throw new Error("Axiom map field lookup returned an unexpected response.");
  }

  return body;
}

async function createMapField(
  config: Config,
  fetcher: FetchLike,
  field: string,
): Promise<void> {
  const response = await fetcher(mapFieldsUrl(config), {
    body: JSON.stringify({ name: field }),
    headers: {
      ...authorizationHeaders(config),
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(
      `Axiom map field creation failed for ${field} with ${
        response.status
      }: ${await response.text()}`,
    );
  }
}

function mapFieldsUrl(config: Config): string {
  return `https://${config.domain}/v2/datasets/${encodeURIComponent(
    config.dataset,
  )}/mapfields`;
}

function authorizationHeaders(config: Config): Record<string, string> {
  return {
    Authorization: `Bearer ${config.token}`,
  };
}

function requiredEnv(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key];

  if (!value) {
    throw new Error(`${key} is required.`);
  }

  return value;
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
