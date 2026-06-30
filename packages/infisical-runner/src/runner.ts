import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  commandSecrets,
  commonSecretPath,
  localEnvironmentSlug,
  type CommandSecretConfig,
} from "./config.js";

export class RunnerError extends Error {
  override name = "RunnerError";
}

export type ParsedCliArguments = {
  app: string;
  command: string;
  commandArgs: string[];
};

export type InfisicalRunRequest = ParsedCliArguments & {
  repoRoot: string;
};

export function getRepoRoot(): string {
  return resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
}

export function parseCliArguments(argv: readonly string[]): ParsedCliArguments {
  const separatorIndex = argv.indexOf("--");

  if (separatorIndex === -1) {
    throw new RunnerError("Expected `--` before the command to run.");
  }

  const runnerArgs = argv.slice(0, separatorIndex);
  const commandArgs = argv.slice(separatorIndex + 1);
  const [app, command, ...extraRunnerArgs] = runnerArgs;

  if (!app || !command || extraRunnerArgs.length > 0) {
    throw new RunnerError(
      "Usage: tsx ../../packages/infisical-runner/src/cli.ts <app> <command> -- <command...>",
    );
  }

  if (commandArgs.length === 0) {
    throw new RunnerError("Expected a command after `--`.");
  }

  return {
    app,
    command,
    commandArgs,
  };
}

export function getCommandSecretConfig(
  app: string,
  command: string,
): CommandSecretConfig {
  const appConfig = commandSecrets[app as keyof typeof commandSecrets];
  const commandConfig = appConfig?.[command as keyof typeof appConfig];

  if (!commandConfig) {
    throw new RunnerError(
      `No Infisical secret mapping exists for app "${app}" command "${command}".`,
    );
  }

  return commandConfig;
}

export function isServerSecretPath(secretPath: string): boolean {
  return secretPath.endsWith("/server") || secretPath.includes("/server/");
}

export function getSecretPaths(config: CommandSecretConfig): string[] {
  return [...new Set([commonSecretPath, ...config.paths])];
}

export function validateSecretPaths(
  app: string,
  command: string,
  config: CommandSecretConfig,
): void {
  if (!config.client) {
    return;
  }

  if (getSecretPaths(config).some(isServerSecretPath)) {
    throw new RunnerError(
      `Refusing to inject server-only secrets into client command "${app}:${command}".`,
    );
  }
}

export function buildInfisicalRunArgs(request: InfisicalRunRequest): string[] {
  const config = getCommandSecretConfig(request.app, request.command);
  validateSecretPaths(request.app, request.command, config);

  const args = [
    "run",
    `--project-config-dir=${request.repoRoot}`,
    `--env=${localEnvironmentSlug}`,
  ];

  for (const secretPath of getSecretPaths(config)) {
    args.push(`--path=${secretPath}`);
  }

  args.push("--", ...request.commandArgs);

  return args;
}

export function hasInfisicalProjectConfig(repoRoot: string): boolean {
  return (
    existsSync(join(repoRoot, "infisical.json")) ||
    existsSync(join(repoRoot, ".infisical.json"))
  );
}

export function assertInfisicalCliAvailable(): void {
  const result = spawnSync("infisical", ["--version"], {
    stdio: "ignore",
  });

  if (result.error) {
    throw new RunnerError(
      [
        "Infisical CLI is required for this command.",
        "",
        "Install it from https://infisical.com/docs/cli/overview, then run:",
        "  infisical login",
        "  infisical init",
        "",
        "Choose the Field Log project when initializing the repo.",
      ].join("\n"),
    );
  }
}

export function assertInfisicalProjectConfig(repoRoot: string): void {
  if (hasInfisicalProjectConfig(repoRoot)) {
    return;
  }

  throw new RunnerError(
    [
      "Infisical project config was not found at the repo root.",
      "",
      "Run this from the monorepo root:",
      "  infisical init",
      "",
      "Choose the Field Log project. Commit infisical.json only if it contains non-secret project metadata.",
    ].join("\n"),
  );
}

export async function runInfisicalCommand(
  request: InfisicalRunRequest,
): Promise<number> {
  assertInfisicalCliAvailable();
  assertInfisicalProjectConfig(request.repoRoot);

  const args = buildInfisicalRunArgs(request);
  const child = spawn("infisical", args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  });

  return new Promise((resolvePromise, reject) => {
    child.on("error", (error) => {
      reject(error);
    });

    child.on("exit", (code, signal) => {
      if (typeof code === "number") {
        resolvePromise(code);
        return;
      }

      console.error(
        `Infisical command exited after signal ${signal ?? "unknown"}.`,
      );
      resolvePromise(1);
    });
  });
}
