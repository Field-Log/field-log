import { spawn, spawnSync } from "node:child_process";

type EnvironmentAlias = {
  from: string;
  to: string;
};

type EnvironmentRunnerOptions = {
  databaseUrlUserOverride?: boolean;
  envAliases?: EnvironmentAlias[];
  secretPaths?: string[];
};

function parseOptions(value: string): EnvironmentRunnerOptions {
  const parsed = JSON.parse(value) as
    | EnvironmentAlias[]
    | EnvironmentRunnerOptions;

  if (!Array.isArray(parsed)) {
    return parsed;
  }

  return {
    envAliases: parsed,
  };
}

function applyAliases(aliases: readonly EnvironmentAlias[]): void {
  for (const alias of aliases) {
    if (process.env[alias.to] || !process.env[alias.from]) {
      continue;
    }

    process.env[alias.to] = process.env[alias.from];
  }
}

function applyDatabaseUrlUserOverride(
  secretPaths: readonly string[] = [],
): void {
  const suffix = getDatabaseUrlUserOverrideSuffix();

  if (!suffix) {
    return;
  }

  const overrideName = `DATABASE_URL_${suffix}`;
  const override = process.env[overrideName];

  if (!override) {
    process.stderr.write(
      `Infisical runner: ${overrideName} not found in ${formatSecretPaths(secretPaths)}; using DATABASE_URL.\n`,
    );
    return;
  }

  process.env.DATABASE_URL = override;
  process.stderr.write(
    `Infisical runner: using ${overrideName} from ${formatSecretPaths(secretPaths)} instead of DATABASE_URL.\n`,
  );
}

function formatSecretPaths(secretPaths: readonly string[]): string {
  return secretPaths.length > 0 ? secretPaths.join(", ") : "configured paths";
}

function getDatabaseUrlUserOverrideSuffix(): string | undefined {
  const explicitSuffix = normalizeSuffix(
    process.env.INFISICAL_DATABASE_URL_SUFFIX,
  );

  if (explicitSuffix) {
    return explicitSuffix;
  }

  const configuredInitials = normalizeSuffix(
    getGitConfigValue("user.initials"),
  );

  if (configuredInitials) {
    return configuredInitials;
  }

  return getNameInitials(getGitConfigValue("user.name"));
}

function getGitConfigValue(key: string): string | undefined {
  const result = spawnSync("git", ["config", key], {
    cwd: process.cwd(),
    encoding: "utf8",
  });

  if (result.status !== 0) {
    return undefined;
  }

  return result.stdout.trim() || undefined;
}

function getNameInitials(name: string | undefined): string | undefined {
  if (!name) {
    return undefined;
  }

  const words = name.split(/[^A-Za-z0-9]+/).filter(Boolean);

  if (words.length === 0) {
    return undefined;
  }

  if (words.length === 1) {
    return normalizeSuffix(words[0]?.slice(0, 2));
  }

  return normalizeSuffix(words.map((word) => word[0]).join(""));
}

function normalizeSuffix(value: string | undefined): string | undefined {
  const suffix = value
    ?.trim()
    .replace(/^_+/, "")
    .replace(/[^A-Za-z0-9]/g, "");

  return suffix ? suffix.toUpperCase() : undefined;
}

const [optionsJson, separator, command, ...commandArgs] = process.argv.slice(2);

if (!optionsJson || separator !== "--" || !command) {
  console.error(
    "Usage: tsx env-alias-runner.ts <options-json> -- <command...>",
  );
  process.exitCode = 1;
} else {
  const options = parseOptions(optionsJson);

  applyAliases(options.envAliases ?? []);

  if (options.databaseUrlUserOverride) {
    applyDatabaseUrlUserOverride(options.secretPaths);
  }

  const child = spawn(command, commandArgs, {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
  });

  child.on("error", (error) => {
    throw error;
  });

  child.on("exit", (code, signal) => {
    if (typeof code === "number") {
      process.exitCode = code;
      return;
    }

    console.error(`Command exited after signal ${signal ?? "unknown"}.`);
    process.exitCode = 1;
  });
}
