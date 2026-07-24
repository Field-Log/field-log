import { spawn, spawnSync } from "node:child_process";

type EnvironmentAlias = {
  from: string;
  to: string;
};

type EnvironmentRunnerOptions = {
  databaseUrlUserOverridePath?: string;
  databaseUrlUserOverride?: boolean;
  envAliases?: EnvironmentAlias[];
  environmentSlug?: string;
  infisicalProjectId?: string;
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

function applyDatabaseUrlUserOverride(options: {
  environmentSlug?: string;
  infisicalProjectId?: string;
  secretPath?: string;
}): void {
  const suffix = getDatabaseUrlUserOverrideSuffix();

  if (!suffix) {
    return;
  }

  const overrideName = `DATABASE_URL_${suffix}`;
  const secretPath = options.secretPath ?? "/local/database";
  const override = getInfisicalSecret({
    environmentSlug: options.environmentSlug,
    infisicalProjectId: options.infisicalProjectId,
    secretName: overrideName,
    secretPath,
  });

  if (!override) {
    process.stderr.write(
      `Infisical runner: ${overrideName} not found in ${secretPath}; using DATABASE_URL.\n`,
    );
    return;
  }

  process.env.DATABASE_URL = override;
  process.stderr.write(
    `Infisical runner: using ${overrideName} from ${secretPath} instead of DATABASE_URL.\n`,
  );
}

function getInfisicalSecret({
  environmentSlug,
  infisicalProjectId,
  secretName,
  secretPath,
}: {
  environmentSlug?: string;
  infisicalProjectId?: string;
  secretName: string;
  secretPath: string;
}): string | undefined {
  const result = spawnSync(
    "infisical",
    [
      "secrets",
      "get",
      secretName,
      `--env=${environmentSlug ?? "dev"}`,
      `--path=${secretPath}`,
      "--plain",
      "--silent",
      ...(infisicalProjectId ? [`--projectId=${infisicalProjectId}`] : []),
    ],
    {
      cwd: process.cwd(),
      encoding: "utf8",
    },
  );

  if (result.status !== 0) {
    return undefined;
  }

  return result.stdout.trim() || undefined;
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
    applyDatabaseUrlUserOverride({
      environmentSlug: options.environmentSlug,
      infisicalProjectId: options.infisicalProjectId,
      secretPath: options.databaseUrlUserOverridePath,
    });
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
