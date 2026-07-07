import { spawn } from "node:child_process";

type EnvironmentAlias = {
  from: string;
  to: string;
};

function parseAliases(value: string): EnvironmentAlias[] {
  const parsed = JSON.parse(value) as EnvironmentAlias[];

  if (!Array.isArray(parsed)) {
    throw new Error("Expected environment aliases to be an array.");
  }

  return parsed;
}

function applyAliases(aliases: readonly EnvironmentAlias[]): void {
  for (const alias of aliases) {
    if (process.env[alias.to] || !process.env[alias.from]) {
      continue;
    }

    process.env[alias.to] = process.env[alias.from];
  }
}

const [aliasesJson, separator, command, ...commandArgs] = process.argv.slice(2);

if (!aliasesJson || separator !== "--" || !command) {
  console.error(
    "Usage: tsx env-alias-runner.ts <aliases-json> -- <command...>",
  );
  process.exitCode = 1;
} else {
  applyAliases(parseAliases(aliasesJson));

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
