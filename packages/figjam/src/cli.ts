import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  fetchFigjamSnapshot,
  getFigmaConfigFromEnv,
  postFigmaComment,
} from "./figma-api.js";
import { serveOutbox } from "./outbox.js";
import { summarizeSnapshot } from "./summary.js";
import type { FigjamSnapshot } from "./types.js";
import { payloadSchemaVersion } from "./types.js";
import { assertAllowedFileKey, validatePayload } from "./validation.js";

const defaultOutboxDir = ".figjam/outbox";
const defaultCacheDir = ".figjam/cache";
const defaultBridgePort = 4873;

type CliCommand =
  | "comment"
  | "help"
  | "read"
  | "serve-outbox"
  | "summarize"
  | "validate-payload"
  | "write-payload";

async function main(argv: readonly string[]): Promise<number> {
  const [rawCommand, ...args] = argv;
  const command = normalizeCommand(rawCommand);

  switch (command) {
    case "comment":
      await comment(args);
      return 0;
    case "read":
      await read(args);
      return 0;
    case "serve-outbox":
      await serve(args);
      return 0;
    case "summarize":
      await summarize(args);
      return 0;
    case "validate-payload":
      await validate(args);
      return 0;
    case "write-payload":
      await writePayload(args);
      return 0;
    case "help":
      printHelp();
      return 0;
  }
}

async function read(args: readonly string[]): Promise<void> {
  const config = getFigmaConfigFromEnv();
  const fileKey = args[0] ?? config.defaultFileKey;
  assertAllowedFileKey(fileKey, config.allowedFileKeys);

  const snapshot = await fetchFigjamSnapshot(config, fileKey);
  const { markdown, nodes } = summarizeSnapshot(snapshot);
  const cacheDir = join(defaultCacheDir, fileKey);

  await mkdir(cacheDir, { recursive: true });
  await writeJson(join(cacheDir, "snapshot.json"), snapshot);
  await writeFile(join(cacheDir, "summary.md"), markdown);
  await writeJson(join(cacheDir, "nodes.json"), nodes);

  console.log(`Wrote FigJam snapshot cache to ${cacheDir}.`);
}

async function summarize(args: readonly string[]): Promise<void> {
  const config = getFigmaConfigFromEnv();
  const snapshotPath =
    args[0] ?? join(defaultCacheDir, config.defaultFileKey, "snapshot.json");
  const snapshot = JSON.parse(
    await readFile(snapshotPath, "utf8"),
  ) as FigjamSnapshot;
  const { markdown, nodes } = summarizeSnapshot(snapshot);
  const outputDir = join(defaultCacheDir, snapshot.fileKey);

  await mkdir(outputDir, { recursive: true });
  await writeFile(join(outputDir, "summary.md"), markdown);
  await writeJson(join(outputDir, "nodes.json"), nodes);

  console.log(`Wrote FigJam summary to ${outputDir}.`);
}

async function validate(args: readonly string[]): Promise<void> {
  const config = getFigmaConfigFromEnv();
  const path = requiredArg(args[0], "validate-payload requires a file path.");
  const payload = validatePayload(JSON.parse(await readFile(path, "utf8")), {
    allowedFileKeys: config.allowedFileKeys,
  });

  console.log(
    `Payload ${payload.payloadId} is valid for ${payload.fileKey} with ${payload.operations.length} operations.`,
  );
}

async function writePayload(args: readonly string[]): Promise<void> {
  const config = getFigmaConfigFromEnv();
  const inputPath = requiredArg(args[0], "write-payload requires a file path.");
  const payload = validatePayload(
    normalizePayloadInput(JSON.parse(await readFile(inputPath, "utf8"))),
    { allowedFileKeys: config.allowedFileKeys },
  );
  const outboxPath = join(defaultOutboxDir, `${payload.payloadId}.json`);

  await mkdir(defaultOutboxDir, { recursive: true });
  await writeJson(outboxPath, payload);

  console.log(`Wrote FigJam payload to ${outboxPath}.`);
}

async function serve(args: readonly string[]): Promise<void> {
  const port = Number(args[0] ?? defaultBridgePort);

  if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
    throw new Error("serve-outbox port must be an integer from 1 to 65535.");
  }

  serveOutbox({
    outboxDir: defaultOutboxDir,
    port,
    print: (message) => console.log(message),
  });
}

async function comment(args: readonly string[]): Promise<void> {
  const config = getFigmaConfigFromEnv();
  const messageIndex = args.indexOf("--message");
  const message = messageIndex >= 0 ? args[messageIndex + 1] : undefined;

  if (!message) {
    throw new Error("comment requires --message <text>.");
  }

  const fileKey = args.find((arg) => !arg.startsWith("--") && arg !== message);
  await postFigmaComment(config, { fileKey, message });
  console.log(
    `Posted FigJam/Figma comment to ${fileKey ?? config.defaultFileKey}.`,
  );
}

function normalizePayloadInput(input: unknown): unknown {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return input;
  }

  const object = input as Record<string, unknown>;
  if (object.schemaVersion) {
    return object;
  }

  return {
    fileKey: process.env.FIGMA_FIGJAM_FILE_KEY ?? "",
    operations: object.operations,
    payloadId: `payload-${new Date().toISOString().replaceAll(/[:.]/g, "-")}`,
    schemaVersion: payloadSchemaVersion,
    source: {
      agent: object.agent ?? "codex",
      branch: process.env.GIT_BRANCH,
      commit: process.env.GIT_COMMIT,
      createdAt: new Date().toISOString(),
      task: object.task,
    },
  };
}

function normalizeCommand(command: string | undefined): CliCommand {
  if (
    command === "comment" ||
    command === "read" ||
    command === "serve-outbox" ||
    command === "summarize" ||
    command === "validate-payload" ||
    command === "write-payload"
  ) {
    return command;
  }

  return "help";
}

function requiredArg(value: string | undefined, message: string): string {
  if (!value) {
    throw new Error(message);
  }

  return value;
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

function printHelp(): void {
  console.log(
    [
      "Usage:",
      "  pnpm figjam read [fileKey]",
      "  pnpm figjam summarize [snapshotPath]",
      "  pnpm figjam validate-payload <payload.json>",
      "  pnpm figjam write-payload <payload-or-operations.json>",
      "  pnpm figjam serve-outbox [port]",
      "  pnpm figjam comment [fileKey] --message <text>",
      "",
      "Run through Infisical for local secrets:",
      "  infisical run --env=dev --path=/local/figma -- pnpm figjam read",
    ].join("\n"),
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = await main(process.argv.slice(2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
