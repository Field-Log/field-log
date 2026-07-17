#!/usr/bin/env node
/* global console, process */

import { spawn } from "node:child_process";

const [, , aliasesJson, separator, command, ...commandArgs] = process.argv;

if (!aliasesJson || separator !== "--" || !command) {
  console.error("Usage: node env-alias.mjs <aliases-json> -- <command...>");
  process.exitCode = 1;
} else {
  const env = { ...process.env };
  const aliases = JSON.parse(aliasesJson);

  for (const alias of aliases) {
    if (!env[alias.to] && env[alias.from]) {
      env[alias.to] = env[alias.from];
    }
  }

  const child = spawn(command, commandArgs, {
    env,
    stdio: "inherit",
  });

  child.on("error", (error) => {
    console.error(error.message);
    process.exitCode = 1;
  });

  child.on("exit", (code, signal) => {
    if (typeof code === "number") {
      process.exitCode = code;
      return;
    }

    console.error(
      `Aliased command exited after signal ${signal ?? "unknown"}.`,
    );
    process.exitCode = 1;
  });
}
