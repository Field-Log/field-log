import { spawn } from "node:child_process";
import { chmodSync, existsSync, statSync, unlinkSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const packageJsonPath = require.resolve("drizzle-view/package.json");
const packageDir = dirname(packageJsonPath);
const binaryName = getBinaryName();
const binaryPath = join(packageDir, "bin", binaryName);

if (existsSync(binaryPath)) {
  const stats = statSync(binaryPath);

  if (stats.size === 0) {
    unlinkSync(binaryPath);
  } else if (process.platform !== "win32") {
    chmodSync(binaryPath, 0o755);
  }
}

const cliPath = require.resolve("drizzle-view/drizzle-view.js");
const child = spawn(process.execPath, [cliPath, ...process.argv.slice(2)], {
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

  console.error(`drizzle-view exited after signal ${signal ?? "unknown"}.`);
  process.exitCode = 1;
});

function getBinaryName() {
  const extension = process.platform === "win32" ? ".exe" : "";

  return `drizzle-view-${process.platform}-${process.arch}${extension}`;
}
